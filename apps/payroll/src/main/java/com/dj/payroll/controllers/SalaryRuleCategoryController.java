package com.dj.payroll.controllers;

import com.dj.payroll.dto.SalaryRuleCategoryDtos;
import com.dj.payroll.services.SalaryRuleCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payroll/salary-rule-categories")
public class SalaryRuleCategoryController {
    private final SalaryRuleCategoryService service;

    public SalaryRuleCategoryController(SalaryRuleCategoryService service) { this.service = service; }

    @GetMapping
    public List<SalaryRuleCategoryDtos.Response> list() { return service.list(); }

    @GetMapping("/{id}")
    public SalaryRuleCategoryDtos.Response get(@PathVariable String id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalaryRuleCategoryDtos.Response create(@Valid @RequestBody SalaryRuleCategoryDtos.CreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public SalaryRuleCategoryDtos.Response update(@PathVariable String id,
                                                  @Valid @RequestBody SalaryRuleCategoryDtos.UpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) { service.delete(id); }
}
