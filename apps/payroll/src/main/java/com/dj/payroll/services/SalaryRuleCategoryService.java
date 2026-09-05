package com.dj.payroll.services;

import com.dj.payroll.dto.SalaryRuleCategoryDtos;
import com.dj.payroll.entities.SalaryRuleCategory;
import com.dj.payroll.exception.ResourceNotFoundException;
import com.dj.payroll.repositories.SalaryRuleCategoryRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SalaryRuleCategoryService {
    private final SalaryRuleCategoryRepository repository;

    public SalaryRuleCategoryService(SalaryRuleCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SalaryRuleCategoryDtos.Response> list() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SalaryRuleCategoryDtos.Response get(String id) {
        return toResponse(find(id));
    }

    public SalaryRuleCategoryDtos.Response create(SalaryRuleCategoryDtos.CreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new DataIntegrityViolationException("Salary rule category code already exists: " + request.code());
        }
        SalaryRuleCategory entity = new SalaryRuleCategory();
        entity.setId(UUID.randomUUID().toString());
        entity.setName(request.name().trim());
        entity.setCode(request.code().trim().toUpperCase());
        entity.setType(request.type().name());
        entity.setDescription(request.description());
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        return toResponse(repository.save(entity));
    }

    public SalaryRuleCategoryDtos.Response update(String id, SalaryRuleCategoryDtos.UpdateRequest request) {
        SalaryRuleCategory entity = find(id);
        entity.setName(request.name().trim());
        entity.setType(request.type().name());
        entity.setDescription(request.description());
        entity.setUpdatedAt(Instant.now());
        return toResponse(repository.save(entity));
    }

    public void delete(String id) {
        SalaryRuleCategory entity = find(id);
        repository.delete(entity);
    }

    private SalaryRuleCategory find(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salary rule category not found: " + id));
    }

    private SalaryRuleCategoryDtos.Response toResponse(SalaryRuleCategory entity) {
        return new SalaryRuleCategoryDtos.Response(entity.getId(), entity.getName(), entity.getCode(),
            SalaryRuleCategoryDtos.RuleCategoryType.valueOf(entity.getType()), entity.getDescription(),
            entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
