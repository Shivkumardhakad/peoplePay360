package com.dj.payroll.services;

import com.dj.payroll.entities.Payslip;
import com.dj.payroll.repositories.PayrunRepository;
import com.dj.payroll.repositories.ReportRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock private PayrunRepository payrunRepository;
    @Mock private ReportRepository reportRepository;

    @Test
    void summaryAggregatesRealPayslipAmountsAndStatuses() {
        var from = LocalDateTime.of(2026, 9, 1, 0, 0);
        var to = LocalDateTime.of(2026, 10, 1, 0, 0);
        when(payrunRepository.countByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqual(from, to)).thenReturn(2L);
        when(reportRepository.findAllByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqualOrderByPeriodStartDescEmployeeIdAsc(from, to))
            .thenReturn(List.of(payslip("PAID", "100.00", "10.00", "90.00"), payslip("COMPUTED", "200.00", "20.00", "180.00")));

        var result = new ReportService(payrunRepository, reportRepository).summary(from, to);

        assertEquals(2L, result.payrunCount());
        assertEquals(2L, result.payslipCount());
        assertEquals(new BigDecimal("300.00"), result.grossAmount());
        assertEquals(1L, result.payslipsByStatus().get("PAID"));
    }

    private Payslip payslip(String status, String gross, String deductions, String net) {
        var payslip = new Payslip();
        payslip.setStatus(status);
        payslip.setGrossAmount(new BigDecimal(gross));
        payslip.setDeductionAmount(new BigDecimal(deductions));
        payslip.setNetAmount(new BigDecimal(net));
        payslip.setPeriodStart(LocalDateTime.of(2026, 9, 1, 0, 0));
        payslip.setPeriodEnd(LocalDateTime.of(2026, 9, 30, 23, 59));
        return payslip;
    }
}
