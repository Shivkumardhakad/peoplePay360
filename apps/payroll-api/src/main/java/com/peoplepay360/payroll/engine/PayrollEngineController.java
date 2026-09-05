package com.peoplepay360.payroll.engine;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payroll/engine")
public class PayrollEngineController {
  private final PayrollEngineService payrollEngine;

  public PayrollEngineController(PayrollEngineService payrollEngine) {
    this.payrollEngine = payrollEngine;
  }

  @PostMapping("/compute")
  public ComputedPayslip compute(@Valid @RequestBody PayrollInput input) {
    return payrollEngine.compute(input);
  }
}
