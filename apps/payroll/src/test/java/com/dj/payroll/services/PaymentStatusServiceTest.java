package com.dj.payroll.services;

import com.dj.payroll.entities.Payrun;
import com.dj.payroll.entities.Payslip;
import com.dj.payroll.repositories.PayrunRepository;
import com.dj.payroll.repositories.PayslipRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentStatusServiceTest {
    @Mock private PayrunRepository payrunRepository;
    @Mock private PayslipRepository payslipRepository;

    @Test
    void payrunStatusAggregatesPaidPayslipsAndNetAmount() {
        var payrun = new Payrun();
        payrun.setId("payrun-1");
        payrun.setStatus("PAID");
        var paid = payslip("PAID", "90.00");
        var computed = payslip("COMPUTED", "100.00");
        when(payrunRepository.findById("payrun-1")).thenReturn(Optional.of(payrun));
        when(payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc("payrun-1")).thenReturn(List.of(paid, computed));

        var result = new PaymentStatusService(payrunRepository, payslipRepository).payrun("payrun-1");

        assertEquals(2, result.payslipCount());
        assertEquals(1, result.paidPayslipCount());
        assertEquals(new BigDecimal("190.00"), result.totalNetAmount());
    }

    private Payslip payslip(String status, String netAmount) {
        var payslip = new Payslip();
        payslip.setStatus(status);
        payslip.setNetAmount(new BigDecimal(netAmount));
        return payslip;
    }
}
