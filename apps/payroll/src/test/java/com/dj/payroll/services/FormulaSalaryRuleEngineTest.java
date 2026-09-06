package com.dj.payroll.services;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FormulaSalaryRuleEngineTest {
    private final FormulaSalaryRuleEngine engine = new FormulaSalaryRuleEngine();

    @Test
    void evaluatesArithmeticWithPayrollVariables() {
        var result = engine.evaluate("base_salary * 10 / 100 + BONUS", Map.of(
            "base_salary", new BigDecimal("2000"), "BONUS", new BigDecimal("50")));

        assertEquals(0, result.compareTo(new BigDecimal("250")));
    }

    @Test
    void rejectsUnknownVariablesAndDivisionByZero() {
        assertThrows(IllegalArgumentException.class, () -> engine.evaluate("unknown + 1", Map.of()));
        assertThrows(IllegalArgumentException.class, () -> engine.evaluate("base_salary / 0", Map.of("base_salary", BigDecimal.TEN)));
    }
}
