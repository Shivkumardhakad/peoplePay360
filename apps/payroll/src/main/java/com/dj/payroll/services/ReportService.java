package com.dj.payroll.services;

import com.dj.payroll.dto.ReportDtos;
import com.dj.payroll.entities.Payslip;
import com.dj.payroll.repositories.PayrunRepository;
import com.dj.payroll.repositories.ReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportService {
    private final PayrunRepository payrunRepository;
    private final ReportRepository reportRepository;

    public ReportService(PayrunRepository payrunRepository, ReportRepository reportRepository) {
        this.payrunRepository = payrunRepository;
        this.reportRepository = reportRepository;
    }

    @Transactional(readOnly = true)
    public ReportDtos.PayrollSummary summary(LocalDateTime from, LocalDateTime to) {
        List<Payslip> payslips = findInPeriod(from, to);
        return new ReportDtos.PayrollSummary(from, to,
            payrunRepository.countByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqual(from, to),
            payslips.size(), sum(payslips, Payslip::getGrossAmount), sum(payslips, Payslip::getDeductionAmount),
            sum(payslips, Payslip::getNetAmount),
            payslips.stream().collect(Collectors.groupingBy(Payslip::getStatus, LinkedHashMap::new, Collectors.counting())));
    }

    @Transactional(readOnly = true)
    public ReportDtos.PayslipReport payslips(LocalDateTime from, LocalDateTime to, String status) {
        List<ReportDtos.PayslipReportRow> rows = findInPeriod(from, to).stream()
            .filter(item -> status == null || status.isBlank() || status.equalsIgnoreCase(item.getStatus()))
            .map(item -> new ReportDtos.PayslipReportRow(item.getId(), item.getPayrunId(), item.getEmployeeId(),
                item.getContractId(), item.getPeriodStart(), item.getPeriodEnd(), item.getStatus(), item.getGrossAmount(),
                item.getDeductionAmount(), item.getNetAmount()))
            .toList();
        return new ReportDtos.PayslipReport(from, to, rows);
    }

    private List<Payslip> findInPeriod(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw new IllegalArgumentException("Report 'from' and 'to' are required and 'to' must be after 'from'");
        }
        return reportRepository.findAllByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqualOrderByPeriodStartDescEmployeeIdAsc(from, to);
    }

    private BigDecimal sum(List<Payslip> payslips, Function<Payslip, BigDecimal> amount) {
        return payslips.stream().map(amount).filter(value -> value != null).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
