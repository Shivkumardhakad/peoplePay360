package com.peoplepay360.payroll.engine;

import com.peoplepay360.payroll.domain.RuleCategory;
import java.math.BigDecimal;
import java.util.List;

public record ComputedPayslip(
    String employeeId,
    String contractId,
    BigDecimal grossPay,
    BigDecimal totalDeductions,
    BigDecimal netPay,
    List<PayslipLine> lines) {

  public record PayslipLine(
      String code,
      String name,
      RuleCategory category,
      BigDecimal amount,
      int sequence) {}
}
