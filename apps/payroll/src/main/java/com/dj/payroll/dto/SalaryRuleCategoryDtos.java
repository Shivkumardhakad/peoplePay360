package com.dj.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public final class SalaryRuleCategoryDtos {
    private SalaryRuleCategoryDtos() {}

    public record CreateRequest(
        @NotBlank String name,
        @NotBlank String code,
        @NotNull RuleCategoryType type,
        String description
    ) {}

    public record UpdateRequest(
        @NotBlank String name,
        @NotNull RuleCategoryType type,
        String description
    ) {}

    public record Response(
        String id, String name, String code, RuleCategoryType type,
        String description, Instant createdAt, Instant updatedAt
    ) {}

    public enum RuleCategoryType { EARNING, DEDUCTION, AGGREGATE }
}
