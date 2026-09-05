package com.dj.payroll.controllers;

import com.dj.payroll.dto.PayrunDtos;
import com.dj.payroll.dto.PayslipDtos;
import com.dj.payroll.services.PayrunService;
import com.dj.payroll.services.PayslipPdfService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    private final PayslipPdfService payslipPdfService;

    public PayrunController(PayrunService service, PayslipPdfService payslipPdfService) {
        this.service = service;
        this.payslipPdfService = payslipPdfService;
    }

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

    @GetMapping("/me/payslips")
    public List<PayslipDtos.EmployeeResponse> listMyPayslips(@AuthenticationPrincipal Jwt jwt) {
        String employeeId = jwt.getClaimAsString("employeeId");
        if (employeeId == null || employeeId.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Employee context is missing");
        }
        return service.listEmployeePayslips(employeeId);
    }

    @GetMapping("/payslips/{id}")
    public PayslipDtos.Response getPayslip(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        PayslipDtos.Response payslip = service.getPayslip(id);
        assertEmployeeOwnsPayslip(payslip, jwt);
        return payslip;
    }

    @GetMapping(value = "/payslips/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPayslipPdf(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        PayslipDtos.Response payslip = service.getPayslip(id);
        assertEmployeeOwnsPayslip(payslip, jwt);
        byte[] pdf = payslipPdfService.generate(payslip);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename("payslip-" + id + ".pdf").build());
        headers.setContentLength(pdf.length);
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    private void assertEmployeeOwnsPayslip(PayslipDtos.Response payslip, Jwt jwt) {
        if ("EMPLOYEE".equals(jwt.getClaimAsString("role"))
            && !payslip.employeeId().equals(jwt.getClaimAsString("employeeId"))) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "You may only access your own payslips");
        }
    }
}
