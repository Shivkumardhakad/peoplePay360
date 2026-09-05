package com.dj.payroll.services;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.Map;

/** Evaluates the restricted arithmetic expression language used by FORMULA salary rules. */
public final class FormulaEvaluator {
    private static final MathContext MATH_CONTEXT = MathContext.DECIMAL128;

    private FormulaEvaluator() {}

    public static BigDecimal evaluate(String expression, Map<String, BigDecimal> variables) {
        if (expression == null || expression.isBlank()) throw new IllegalArgumentException("Formula is required");
        Parser parser = new Parser(expression, variables);
        BigDecimal result = parser.expression();
        parser.skipWhitespace();
        if (!parser.atEnd()) throw new IllegalArgumentException("Unexpected token in formula near: " + parser.remaining());
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
                if (match('+')) value = value.add(term(), MATH_CONTEXT);
                else if (match('-')) value = value.subtract(term(), MATH_CONTEXT);
                else return value;
            }
        }

        private BigDecimal term() {
            BigDecimal value = factor();
            while (true) {
                skipWhitespace();
                if (match('*')) value = value.multiply(factor(), MATH_CONTEXT);
                else if (match('/')) {
                    BigDecimal divisor = factor();
                    if (divisor.compareTo(BigDecimal.ZERO) == 0) throw new IllegalArgumentException("Formula cannot divide by zero");
                    value = value.divide(divisor, MATH_CONTEXT);
                } else return value;
            }
        }

        private BigDecimal factor() {
            skipWhitespace();
            if (match('+')) return factor();
            if (match('-')) return factor().negate(MATH_CONTEXT);
            if (match('(')) {
                BigDecimal value = expression();
                if (!match(')')) throw new IllegalArgumentException("Formula has an unclosed parenthesis");
                return value;
            }
            if (position < input.length() && (Character.isLetter(input.charAt(position)) || input.charAt(position) == '_')) {
                String name = readIdentifier();
                BigDecimal value = variables.get(name.toUpperCase());
                if (value == null) throw new IllegalArgumentException("Unknown salary rule code in formula: " + name);
                return value;
            }
            return readNumber();
        }

        private BigDecimal readNumber() {
            skipWhitespace();
            int start = position;
            boolean decimalPoint = false;
            while (position < input.length()) {
                char character = input.charAt(position);
                if (Character.isDigit(character)) position++;
                else if (character == '.' && !decimalPoint) { decimalPoint = true; position++; }
                else break;
            }
            if (start == position) throw new IllegalArgumentException("Expected a number, variable, or parenthesis in formula");
            return new BigDecimal(input.substring(start, position));
        }

        private String readIdentifier() {
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
        private String remaining() { return input.substring(Math.min(position, input.length())); }
    }
}
