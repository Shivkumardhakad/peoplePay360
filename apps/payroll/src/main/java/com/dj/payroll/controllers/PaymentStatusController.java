package com.dj.payroll.controllers;

import com.dj.payroll.dto.PaymentStatusDtos;
import com.dj.payroll.services.PaymentStatusService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payroll")
public class PaymentStatusController {
    private final PaymentStatusService service;

    public PaymentStatusController(PaymentStatusService service) {
        this.service = service;
    }

    @GetMapping("/payruns/{id}/payment-status")
    public PaymentStatusDtos.PayrunStatus payrunStatus(@PathVariable String id) {
        return service.payrun(id);
    }

    @GetMapping("/payslips/{id}/payment-status")
    public PaymentStatusDtos.PayslipStatus payslipStatus(@PathVariable String id) {
        return service.payslip(id);
    }
}
