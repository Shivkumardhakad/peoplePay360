package com.dj.payroll.services;

import com.dj.payroll.dto.PaymentStatusDtos;
import com.dj.payroll.entities.Payslip;
import com.dj.payroll.exception.ResourceNotFoundException;
import com.dj.payroll.repositories.PayrunRepository;
import com.dj.payroll.repositories.PayslipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class PaymentStatusService {
    private final PayrunRepository payrunRepository;
    private final PayslipRepository payslipRepository;

    public PaymentStatusService(PayrunRepository payrunRepository, PayslipRepository payslipRepository) {
        this.payrunRepository = payrunRepository;
        this.payslipRepository = payslipRepository;
    }

    @Transactional(readOnly = true)
    public PaymentStatusDtos.PayrunStatus payrun(String id) {
        var payrun = payrunRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payrun not found: " + id));
        List<Payslip> payslips = payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc(id);
        long paid = payslips.stream().filter(item -> "PAID".equals(item.getStatus())).count();
        BigDecimal total = payslips.stream().map(Payslip::getNetAmount).filter(item -> item != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new PaymentStatusDtos.PayrunStatus(id, payrun.getStatus(), payrun.getPaidAt(), payslips.size(), paid, total);
    }

    @Transactional(readOnly = true)
    public PaymentStatusDtos.PayslipStatus payslip(String id) {
        var payslip = payslipRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payslip not found: " + id));
        Instant paidAt = "PAID".equals(payslip.getStatus()) ? payslip.getUpdatedAt() : null;
        return new PaymentStatusDtos.PayslipStatus(payslip.getId(), payslip.getPayrunId(), payslip.getEmployeeId(),
            payslip.getStatus(), paidAt, payslip.getNetAmount());
    }
}
