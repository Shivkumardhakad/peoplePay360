package com.dj.payroll.controllers;

import com.dj.payroll.dto.PayrollAuditDtos;
import com.dj.payroll.services.PayrollAuditorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payroll/payruns")
public class PayrollAuditController {
    private final PayrollAuditorService service;

    public PayrollAuditController(PayrollAuditorService service) {
        this.service = service;
    }

    @GetMapping("/{id}/audit")
    public PayrollAuditDtos.Response audit(@PathVariable String id) {
        return service.audit(id);
    }
}
