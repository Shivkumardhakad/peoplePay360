package com.dj.payroll.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.Instant;
import java.util.List;

public final class SalaryStructureDtos {
    private SalaryStructureDtos() {}

    public record CreateRequest(
        @NotBlank String name,
        @NotBlank String code,
        String description,
        @NotEmpty List<@Valid RuleAssignment> rules
    ) {}

    public record UpdateRequest(
        @NotBlank String name,
        String description,
        @NotNull String status,
        @NotEmpty List<@Valid RuleAssignment> rules
    ) {}

    public record RuleAssignment(
        @NotBlank String salaryRuleId,
        @PositiveOrZero int sequence
    ) {}

    public record RuleResponse(String salaryRuleId, int sequence) {}

    public record Response(
        String id, String name, String code, String description, String status,
        List<RuleResponse> rules, Instant createdAt, Instant updatedAt
    ) {}
}
