package com.dj.payroll.services;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FormulaEvaluatorTest {
    @Test
    void evaluatesRuleReferencesAndOperatorPrecedence() {
        BigDecimal result = FormulaEvaluator.evaluate("BASIC * 0.1 + (BONUS - 5)", Map.of("BASIC", new BigDecimal("1000"), "BONUS", new BigDecimal("50")));
        assertEquals(new BigDecimal("145.0"), result);
    }

    @Test
    void rejectsUnknownCodesAndDivisionByZero() {
        assertThrows(IllegalArgumentException.class, () -> FormulaEvaluator.evaluate("UNKNOWN + 1", Map.of()));
        assertThrows(IllegalArgumentException.class, () -> FormulaEvaluator.evaluate("10 / 0", Map.of()));
    }
}
