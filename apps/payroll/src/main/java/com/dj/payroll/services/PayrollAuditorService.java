package com.dj.payroll.services;

import com.dj.payroll.dto.PayrollAuditDtos;
import com.dj.payroll.entities.Payrun;
import com.dj.payroll.entities.Payslip;
import com.dj.payroll.repositories.PayrunRepository;
import com.dj.payroll.repositories.PayslipLineRepository;
import com.dj.payroll.repositories.PayslipRepository;
import com.dj.payroll.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class PayrollAuditorService {
    private static final String AUDITOR_VERSION = "rules-v1";
    private final PayrunRepository payrunRepository;
    private final PayslipRepository payslipRepository;
    private final PayslipLineRepository payslipLineRepository;

    public PayrollAuditorService(PayrunRepository payrunRepository, PayslipRepository payslipRepository,
                                 PayslipLineRepository payslipLineRepository) {
        this.payrunRepository = payrunRepository;
        this.payslipRepository = payslipRepository;
        this.payslipLineRepository = payslipLineRepository;
    }

    @Transactional(readOnly = true)
    public PayrollAuditDtos.Response audit(String payrunId) {
        Payrun payrun = payrunRepository.findById(payrunId)
            .orElseThrow(() -> new ResourceNotFoundException("Payrun not found: " + payrunId));
        List<Payslip> payslips = payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc(payrunId);
        List<PayrollAuditDtos.Finding> findings = new ArrayList<>();

        if (payslips.isEmpty()) {
            add(findings, "CRITICAL", "NO_PAYSLIPS", "Payrun has no generated payslips", (String) null);
        }
        if ("DRAFT".equals(payrun.getStatus())) {
            add(findings, "WARNING", "DRAFT_PAYRUN", "Payrun has not been computed", (String) null);
        }
        Set<String> employees = new HashSet<>();
        for (Payslip payslip : payslips) auditPayslip(payslip, employees, findings);

        long errors = findings.stream().filter(item -> "CRITICAL".equals(item.severity()) || "ERROR".equals(item.severity())).count();
        long warnings = findings.stream().filter(item -> "WARNING".equals(item.severity())).count();
        int riskScore = Math.max(0, 100 - (int) (errors * 25 + warnings * 10));
        return new PayrollAuditDtos.Response(payrunId, payrun.getStatus(), AUDITOR_VERSION,
            errors == 0, riskScore, findings);
    }

    private void auditPayslip(Payslip payslip, Set<String> employees, List<PayrollAuditDtos.Finding> findings) {
        if (!employees.add(payslip.getEmployeeId())) {
            add(findings, "ERROR", "DUPLICATE_EMPLOYEE", "Multiple payslips found for the same employee", payslip);
        }
        if (payslip.getGrossAmount() == null || payslip.getDeductionAmount() == null || payslip.getNetAmount() == null) {
            add(findings, "ERROR", "MISSING_TOTAL", "Payslip is missing one or more payroll totals", payslip);
            return;
        }
        if (payslip.getGrossAmount().compareTo(BigDecimal.ZERO) < 0 || payslip.getDeductionAmount().compareTo(BigDecimal.ZERO) < 0) {
            add(findings, "ERROR", "NEGATIVE_TOTAL", "Gross or deduction amount cannot be negative", payslip);
        }
        if (payslip.getDeductionAmount().compareTo(payslip.getGrossAmount()) > 0) {
            add(findings, "ERROR", "DEDUCTIONS_EXCEED_GROSS", "Deductions exceed gross salary", payslip);
        }
        if (payslip.getGrossAmount().subtract(payslip.getDeductionAmount()).compareTo(payslip.getNetAmount()) != 0) {
            add(findings, "ERROR", "NET_TOTAL_MISMATCH", "Net salary does not equal gross minus deductions", payslip);
        }
        if (payslipLineRepository.findAllByPayslipIdOrderBySequenceAsc(payslip.getId()).isEmpty()) {
            add(findings, "WARNING", "NO_PAYSLIP_LINES", "Payslip has no salary-rule lines", payslip);
        }
    }

    private void add(List<PayrollAuditDtos.Finding> findings, String severity, String code, String message, Payslip payslip) {
        findings.add(new PayrollAuditDtos.Finding(severity, code, message,
            payslip == null ? null : payslip.getId(), payslip == null ? null : payslip.getEmployeeId()));
    }

    private void add(List<PayrollAuditDtos.Finding> findings, String severity, String code, String message, String payslipId) {
        findings.add(new PayrollAuditDtos.Finding(severity, code, message, payslipId, null));
    }
}
