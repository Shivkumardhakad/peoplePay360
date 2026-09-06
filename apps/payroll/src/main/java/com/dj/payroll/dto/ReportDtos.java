package com.dj.payroll.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class ReportDtos {
    private ReportDtos() {}

    public record PayrollSummary(
        LocalDateTime from, LocalDateTime to, long payrunCount, long payslipCount,
        BigDecimal grossAmount, BigDecimal deductionAmount, BigDecimal netAmount,
        Map<String, Long> payslipsByStatus
    ) {}

    public record PayslipReportRow(
        String payslipId, String payrunId, String employeeId, String contractId,
        LocalDateTime periodStart, LocalDateTime periodEnd, String status,
        BigDecimal grossAmount, BigDecimal deductionAmount, BigDecimal netAmount
    ) {}

    public record PayslipReport(
        LocalDateTime from, LocalDateTime to, List<PayslipReportRow> payslips
    ) {}
}
