package com.dj.payroll.services;

import com.dj.payroll.dto.PayslipDtos;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PayslipPdfServiceTest {
    @Test
    void generateReturnsPdfWithPayslipData() {
        var payslip = new PayslipDtos.Response(
            "payslip-1", "payrun-1", "employee-1", "contract-1",
            LocalDateTime.of(2026, 9, 1, 0, 0),
            LocalDateTime.of(2026, 9, 30, 23, 59),
            new BigDecimal("1000.00"), new BigDecimal("100.00"), new BigDecimal("900.00"),
            "COMPUTED",
            List.of(new PayslipDtos.LineResponse(
                "line-1", "rule-1", "BASIC", "Basic Salary", "EARNING", 1,
                BigDecimal.ONE, new BigDecimal("1000.00"), new BigDecimal("1000.00"), Instant.now()
            )),
            Instant.now(), Instant.now()
        );

        byte[] pdf = new PayslipPdfService().generate(payslip);

        assertTrue(pdf.length > 100);
        assertArrayEquals(new byte[] {'%', 'P', 'D', 'F'}, Arrays.copyOf(pdf, 4));
    }
}
