package com.dj.payroll.controllers;

import com.dj.payroll.dto.PayrunDtos;
import com.dj.payroll.dto.PayslipDtos;
import com.dj.payroll.services.PayrunService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
public class PayrunController {
    private final PayrunService service;

    public PayrunController(PayrunService service) { this.service = service; }

    @GetMapping("/payruns")
    public List<PayrunDtos.Response> listPayruns() { return service.list(); }

    @GetMapping("/payruns/{id}")
    public PayrunDtos.Response getPayrun(@PathVariable String id) { return service.get(id); }

    @PostMapping("/payruns")
    @ResponseStatus(HttpStatus.CREATED)
    public PayrunDtos.Response createPayrun(@Valid @RequestBody PayrunDtos.CreateRequest request,
                                            Authentication authentication) {
        return service.create(request, authentication.getName());
    }

    @PostMapping("/payruns/{id}/compute")
    public PayrunDtos.Response compute(@PathVariable String id) { return service.compute(id); }

    @PostMapping("/payruns/{id}/validate")
    public PayrunDtos.ValidationResponse validate(@PathVariable String id) { return service.validate(id); }

    @PostMapping("/payruns/{id}/pay")
    public PayrunDtos.Response markPaid(@PathVariable String id) { return service.markPaid(id); }

    @PostMapping("/payruns/{id}/cancel")
    public PayrunDtos.Response cancel(@PathVariable String id) { return service.cancel(id); }

    @GetMapping("/payruns/{payrunId}/payslips")
    public List<PayslipDtos.Response> listPayslips(@PathVariable String payrunId) {
        return service.listPayslips(payrunId);
    }

    @GetMapping("/payslips/{id}")
    public PayslipDtos.Response getPayslip(@PathVariable String id) { return service.getPayslip(id); }
}
