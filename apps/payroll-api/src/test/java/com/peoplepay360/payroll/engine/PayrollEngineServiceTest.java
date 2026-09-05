package com.peoplepay360.payroll.engine;

import static org.assertj.core.api.Assertions.assertThat;

import com.peoplepay360.payroll.domain.ComputationType;
import com.peoplepay360.payroll.domain.RuleCategory;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class PayrollEngineServiceTest {
  private final PayrollEngineService payrollEngine = new PayrollEngineService();

  @Test
  void computesFixedPercentageSumGrossAndNetAmounts() {
    var input =
        new PayrollInput(
            "employee-1",
            "contract-1",
            "STANDARD_MONTHLY",
            new BigDecimal("5000.00"),
            List.of(
                new PayrollInput.RuleInput(
                    "BASIC", "Basic Salary", RuleCategory.BASIC, 10, ComputationType.FIXED, BigDecimal.ZERO, null, List.of()),
                new PayrollInput.RuleInput(
                    "HRA", "Housing Allowance", RuleCategory.ALLOWANCE, 20, ComputationType.PERCENTAGE, null, new BigDecimal("20"), List.of("BASIC")),
                new PayrollInput.RuleInput(
                    "GROSS", "Gross Salary", RuleCategory.GROSS, 90, ComputationType.SUM, null, null, List.of("BASIC", "HRA")),
                new PayrollInput.RuleInput(
                    "TAX", "Income Tax", RuleCategory.DEDUCTION, 100, ComputationType.PERCENTAGE, null, new BigDecimal("10"), List.of("GROSS"))));

    var payslip = payrollEngine.compute(input);

    assertThat(payslip.grossPay()).isEqualByComparingTo("6000.00");
    assertThat(payslip.totalDeductions()).isEqualByComparingTo("600.00");
    assertThat(payslip.netPay()).isEqualByComparingTo("5400.00");
    assertThat(payslip.lines()).extracting(ComputedPayslip.PayslipLine::code).containsExactly("BASIC", "HRA", "GROSS", "TAX");
  }
}
