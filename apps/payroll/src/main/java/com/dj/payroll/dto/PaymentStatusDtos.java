package com.dj.payroll.dto;

import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentStatusDtos {
    private PaymentStatusDtos() {}

    public record PayrunStatus(
        String payrunId, String status, Instant paidAt, long payslipCount,
        long paidPayslipCount, BigDecimal totalNetAmount
    ) {}

    public record PayslipStatus(
        String payslipId, String payrunId, String employeeId, String status,
        Instant paidAt, BigDecimal netAmount
    ) {}
}
