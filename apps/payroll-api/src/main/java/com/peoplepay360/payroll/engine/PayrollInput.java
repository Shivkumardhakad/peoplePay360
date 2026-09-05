package com.peoplepay360.payroll.engine;

import com.peoplepay360.payroll.domain.ComputationType;
import com.peoplepay360.payroll.domain.RuleCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.List;

public record PayrollInput(
    @NotBlank String employeeId,
    @NotBlank String contractId,
    @NotBlank String payrollProfileCode,
    @NotNull @PositiveOrZero BigDecimal baseSalary,
    @NotEmpty List<RuleInput> rules) {

  public record RuleInput(
      @NotBlank String code,
      @NotBlank String name,
      @NotNull RuleCategory category,
      int sequence,
      @NotNull ComputationType computationType,
      BigDecimal amount,
      BigDecimal percentage,
      List<String> baseRuleCodes) {}
}
