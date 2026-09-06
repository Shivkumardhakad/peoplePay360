package com.dj.payroll.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public final class PayslipDtos {
    private PayslipDtos() {}

    public record Response(
        String id, String payrunId, String employeeId, String contractId,
        LocalDateTime periodStart, LocalDateTime periodEnd,
        BigDecimal grossAmount, BigDecimal deductionAmount, BigDecimal netAmount,
        String status, List<LineResponse> lines, Instant createdAt, Instant updatedAt
    ) {}

    public record EmployeeResponse(
        String id, String payrunId, String payrunName, String employeeId, String contractId,
        LocalDateTime periodStart, LocalDateTime periodEnd,
        BigDecimal grossAmount, BigDecimal deductionAmount, BigDecimal netAmount,
        String status, List<LineResponse> lines, Instant createdAt, Instant updatedAt
    ) {}

    public record LineResponse(
        String id, String salaryRuleId, String code, String name,
        String categoryId, int sequence, BigDecimal quantity,
        BigDecimal rate, BigDecimal amount, Instant createdAt
    ) {}
}
