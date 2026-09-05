package com.dj.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public final class PayrunDtos {
    private PayrunDtos() {}

    public record CreateRequest(
        @NotBlank String name,
        @NotNull LocalDateTime periodStart,
        @NotNull LocalDateTime periodEnd,
        @NotBlank String salaryStructureId
    ) {}

    public record Response(
        String id, String name, LocalDateTime periodStart, LocalDateTime periodEnd,
        String salaryStructureId, String status, Instant computedAt,
        Instant validatedAt, Instant paidAt, List<PayslipSummary> payslips,
        Instant createdAt, Instant updatedAt
    ) {}

    public record PayslipSummary(
        String id, String employeeId, BigDecimal grossAmount,
        BigDecimal deductionAmount, BigDecimal netAmount, String status
    ) {}

    public record ValidationResponse(
        String payrunId, String status, List<String> warnings
    ) {}
}
