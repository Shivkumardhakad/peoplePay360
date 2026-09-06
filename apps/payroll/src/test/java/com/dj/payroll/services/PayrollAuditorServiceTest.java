package com.dj.payroll.services;

import com.dj.payroll.entities.Payrun;
import com.dj.payroll.entities.Payslip;
import com.dj.payroll.repositories.PayrunRepository;
import com.dj.payroll.repositories.PayslipLineRepository;
import com.dj.payroll.repositories.PayslipRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollAuditorServiceTest {
    @Mock private PayrunRepository payrunRepository;
    @Mock private PayslipRepository payslipRepository;
    @Mock private PayslipLineRepository payslipLineRepository;

    @Test
    void auditFlagsInconsistentPayslipTotals() {
        var payrun = new Payrun();
        payrun.setId("payrun-1");
        payrun.setStatus("COMPUTED");
        var payslip = new Payslip();
        payslip.setId("payslip-1");
        payslip.setEmployeeId("employee-1");
        payslip.setGrossAmount(new BigDecimal("100.00"));
        payslip.setDeductionAmount(new BigDecimal("10.00"));
        payslip.setNetAmount(new BigDecimal("80.00"));
        when(payrunRepository.findById("payrun-1")).thenReturn(Optional.of(payrun));
        when(payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc("payrun-1")).thenReturn(List.of(payslip));
        when(payslipLineRepository.findAllByPayslipIdOrderBySequenceAsc("payslip-1")).thenReturn(List.of());

        var result = new PayrollAuditorService(payrunRepository, payslipRepository, payslipLineRepository).audit("payrun-1");

        assertFalse(result.passed());
        assertTrue(result.findings().stream().anyMatch(finding -> "NET_TOTAL_MISMATCH".equals(finding.code())));
        assertTrue(result.findings().stream().anyMatch(finding -> "NO_PAYSLIP_LINES".equals(finding.code())));
    }
}
