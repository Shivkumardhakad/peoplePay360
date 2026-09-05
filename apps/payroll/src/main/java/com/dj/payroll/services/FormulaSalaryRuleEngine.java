package com.dj.payroll.services;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class FormulaSalaryRuleEngine {
    private static final MathContext MATH = new MathContext(16, RoundingMode.HALF_UP);

    public BigDecimal evaluate(String formula, Map<String, BigDecimal> variables) {
        if (formula == null || formula.isBlank()) throw new IllegalArgumentException("Formula is required");
        var parser = new Parser(formula, variables);
        BigDecimal result = parser.expression();
        parser.skipWhitespace();
        if (!parser.atEnd()) throw new IllegalArgumentException("Invalid formula near: " + formula.substring(parser.position));
        return result;
    }

    private static final class Parser {
        private final String input;
        private final Map<String, BigDecimal> variables;
        private int position;

        private Parser(String input, Map<String, BigDecimal> variables) {
            this.input = input;
            this.variables = variables;
        }

        private BigDecimal expression() {
            BigDecimal value = term();
            while (true) {
                skipWhitespace();
                if (match('+')) value = value.add(term(), MATH);
                else if (match('-')) value = value.subtract(term(), MATH);
                else return value;
            }
        }

        private BigDecimal term() {
            BigDecimal value = factor();
            while (true) {
                skipWhitespace();
                if (match('*')) value = value.multiply(factor(), MATH);
                else if (match('/')) {
                    BigDecimal divisor = factor();
                    if (divisor.compareTo(BigDecimal.ZERO) == 0) throw new IllegalArgumentException("Formula cannot divide by zero");
                    value = value.divide(divisor, MATH);
                } else return value;
            }
        }

        private BigDecimal factor() {
            skipWhitespace();
            if (match('+')) return factor();
            if (match('-')) return factor().negate(MATH);
            if (match('(')) {
                BigDecimal value = expression();
                if (!match(')')) throw new IllegalArgumentException("Formula has an unclosed parenthesis");
                return value;
            }
            if (position < input.length() && (Character.isDigit(input.charAt(position)) || input.charAt(position) == '.')) return number();
            String identifier = identifier();
            if (identifier.isEmpty()) throw new IllegalArgumentException("Formula expects a number, variable, or parenthesis");
            BigDecimal value = variables.get(identifier);
            if (value == null) value = variables.get(identifier.toLowerCase());
            if (value == null) throw new IllegalArgumentException("Unknown formula variable: " + identifier);
            return value;
        }

        private BigDecimal number() {
            int start = position;
            while (position < input.length() && (Character.isDigit(input.charAt(position)) || input.charAt(position) == '.')) position++;
            try { return new BigDecimal(input.substring(start, position)); }
            catch (NumberFormatException exception) { throw new IllegalArgumentException("Invalid formula number", exception); }
        }

        private String identifier() {
            int start = position;
            while (position < input.length() && (Character.isLetterOrDigit(input.charAt(position)) || input.charAt(position) == '_')) position++;
            return input.substring(start, position);
        }

        private boolean match(char expected) {
            if (position < input.length() && input.charAt(position) == expected) { position++; return true; }
            return false;
        }

        private void skipWhitespace() { while (position < input.length() && Character.isWhitespace(input.charAt(position))) position++; }
        private boolean atEnd() { return position >= input.length(); }
    }
}
