package com.dj.payroll.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.Instant;

public final class SalaryRuleDtos {
    private SalaryRuleDtos() {}

    public record CreateRequest(
        @NotBlank String name,
        @NotBlank String code,
        @NotBlank String categoryId,
        @PositiveOrZero int sequence,
        @NotNull ComputationType calculationType,
        @Digits(integer = 11, fraction = 4) @DecimalMin("0.00") BigDecimal value,
        String formula
    ) {}

    public record UpdateRequest(
        @NotBlank String name,
        @NotBlank String categoryId,
        @PositiveOrZero int sequence,
        @NotNull ComputationType calculationType,
        @Digits(integer = 11, fraction = 4) @DecimalMin("0.00") BigDecimal value,
        String formula
    ) {}

    public record Response(
        String id, String name, String code, String categoryId, int sequence,
        ComputationType calculationType, BigDecimal value, String formula,
        String status, Instant createdAt, Instant updatedAt
    ) {}

    public enum ComputationType { FIXED, PERCENTAGE, FORMULA }
}
