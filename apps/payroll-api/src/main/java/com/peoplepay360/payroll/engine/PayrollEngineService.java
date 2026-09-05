package com.peoplepay360.payroll.engine;

import com.peoplepay360.payroll.domain.ComputationType;
import com.peoplepay360.payroll.domain.RuleCategory;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PayrollEngineService {
  private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

  public ComputedPayslip compute(PayrollInput input) {
    Map<String, BigDecimal> amountsByCode = new HashMap<>();
    var lines =
        input.rules().stream()
            .sorted(Comparator.comparingInt(PayrollInput.RuleInput::sequence))
            .map(
                rule -> {
                  BigDecimal amount = computeRuleAmount(input, rule, amountsByCode);
                  amountsByCode.put(rule.code(), amount);
                  return new ComputedPayslip.PayslipLine(
                      rule.code(), rule.name(), rule.category(), amount, rule.sequence());
                })
            .toList();

    BigDecimal grossPay =
        lines.stream()
            .filter(line -> line.category() == RuleCategory.GROSS)
            .findFirst()
            .map(ComputedPayslip.PayslipLine::amount)
            .orElseGet(
                () ->
                    lines.stream()
                        .filter(
                            line ->
                                line.category() == RuleCategory.BASIC
                                    || line.category() == RuleCategory.ALLOWANCE)
                        .map(ComputedPayslip.PayslipLine::amount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));

    BigDecimal totalDeductions =
        lines.stream()
            .filter(
                line ->
                    line.category() == RuleCategory.DEDUCTION
                        || line.category() == RuleCategory.CONTRIBUTION)
            .map(ComputedPayslip.PayslipLine::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    return new ComputedPayslip(
        input.employeeId(),
        input.contractId(),
        money(grossPay),
        money(totalDeductions),
        money(grossPay.subtract(totalDeductions)),
        lines);
  }

  private BigDecimal computeRuleAmount(
      PayrollInput input, PayrollInput.RuleInput rule, Map<String, BigDecimal> amountsByCode) {
    if ("BASIC".equals(rule.code())
        && rule.computationType() == ComputationType.FIXED
        && (rule.amount() == null || BigDecimal.ZERO.compareTo(rule.amount()) == 0)) {
      return money(input.baseSalary());
    }

    return switch (rule.computationType()) {
      case FIXED -> money(rule.amount() == null ? BigDecimal.ZERO : rule.amount());
      case PERCENTAGE ->
          money(baseAmount(rule, amountsByCode).multiply(rule.percentage()).divide(ONE_HUNDRED, 6, RoundingMode.HALF_UP));
      case SUM -> money(baseAmount(rule, amountsByCode));
      case FORMULA -> throw new IllegalArgumentException("Formula rules are not enabled in the MVP payroll engine.");
    };
  }

  private BigDecimal baseAmount(PayrollInput.RuleInput rule, Map<String, BigDecimal> amountsByCode) {
    if (rule.baseRuleCodes() == null || rule.baseRuleCodes().isEmpty()) {
      return BigDecimal.ZERO;
    }

    return rule.baseRuleCodes().stream()
        .map(
            code -> {
              BigDecimal amount = amountsByCode.get(code);
              if (amount == null) {
                throw new IllegalArgumentException("Salary rule dependency " + code + " has not been computed.");
              }
              return amount;
            })
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private BigDecimal money(BigDecimal value) {
    return value.setScale(2, RoundingMode.HALF_UP);
  }
}
