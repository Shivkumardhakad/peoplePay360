package com.dj.payroll.controllers;

import com.dj.payroll.dto.SalaryRuleDtos;
import com.dj.payroll.services.SalaryRuleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payroll/salary-rules")
public class SalaryRuleController {
    private final SalaryRuleService service;

    public SalaryRuleController(SalaryRuleService service) { this.service = service; }

    @GetMapping
    public List<SalaryRuleDtos.Response> list(@RequestParam(required = false) String categoryId) {
        return service.list(categoryId);
    }

    @GetMapping("/{id}")
    public SalaryRuleDtos.Response get(@PathVariable String id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalaryRuleDtos.Response create(@Valid @RequestBody SalaryRuleDtos.CreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public SalaryRuleDtos.Response update(@PathVariable String id,
                                          @Valid @RequestBody SalaryRuleDtos.UpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable String id) { service.deactivate(id); }
}
