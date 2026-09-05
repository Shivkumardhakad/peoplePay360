package com.dj.payroll.controllers;

import com.dj.payroll.dto.SalaryStructureDtos;
import com.dj.payroll.services.SalaryStructureService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/payroll/salary-structures")
public class SalaryStructureController {
    private final SalaryStructureService service;

    public SalaryStructureController(SalaryStructureService service) { this.service = service; }

    @GetMapping
    public List<SalaryStructureDtos.Response> list() { return service.list(); }

    @GetMapping("/{id}")
    public SalaryStructureDtos.Response get(@PathVariable String id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SalaryStructureDtos.Response create(@Valid @RequestBody SalaryStructureDtos.CreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public SalaryStructureDtos.Response update(@PathVariable String id,
                                               @Valid @RequestBody SalaryStructureDtos.UpdateRequest request) {
        return service.update(id, request);
    }
}
