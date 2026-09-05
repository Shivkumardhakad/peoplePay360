package com.dj.payroll.services;

import com.dj.payroll.dto.SalaryRuleDtos;
import com.dj.payroll.entities.SalaryRule;
import com.dj.payroll.exception.ResourceNotFoundException;
import com.dj.payroll.repositories.SalaryRuleCategoryRepository;
import com.dj.payroll.repositories.SalaryRuleRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SalaryRuleService {
    private final SalaryRuleRepository repository;
    private final SalaryRuleCategoryRepository categoryRepository;

    public SalaryRuleService(SalaryRuleRepository repository, SalaryRuleCategoryRepository categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<SalaryRuleDtos.Response> list(String categoryId) {
        List<SalaryRule> rules = categoryId == null
            ? repository.findAllByOrderBySequenceAscCodeAsc()
            : repository.findAllByCategoryIdOrderBySequenceAscCodeAsc(categoryId);
        return rules.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SalaryRuleDtos.Response get(String id) { return toResponse(find(id)); }

    public SalaryRuleDtos.Response create(SalaryRuleDtos.CreateRequest request) {
        validateCalculation(request.calculationType(), request.value(), request.formula());
        ensureCategory(request.categoryId());
        if (repository.existsByCode(request.code())) {
            throw new DataIntegrityViolationException("Salary rule code already exists: " + request.code());
        }
        SalaryRule entity = new SalaryRule();
        entity.setId(UUID.randomUUID().toString());
        entity.setName(request.name().trim());
        entity.setCode(request.code().trim().toUpperCase());
        copy(entity, request.categoryId(), request.sequence(), request.calculationType(), request.value(), request.formula());
        entity.setStatus("ACTIVE");
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        return toResponse(repository.save(entity));
    }

    public SalaryRuleDtos.Response update(String id, SalaryRuleDtos.UpdateRequest request) {
        validateCalculation(request.calculationType(), request.value(), request.formula());
        ensureCategory(request.categoryId());
        SalaryRule entity = find(id);
        entity.setName(request.name().trim());
        copy(entity, request.categoryId(), request.sequence(), request.calculationType(), request.value(), request.formula());
        entity.setUpdatedAt(Instant.now());
        return toResponse(repository.save(entity));
    }

    public void deactivate(String id) {
        SalaryRule entity = find(id);
        entity.setStatus("INACTIVE");
        entity.setUpdatedAt(Instant.now());
        repository.save(entity);
    }

    private void copy(SalaryRule entity, String categoryId, int sequence,
                      SalaryRuleDtos.ComputationType type, java.math.BigDecimal value, String formula) {
        entity.setCategoryId(categoryId);
        entity.setSequence(sequence);
        entity.setCalculationType(type.name());
        entity.setValue(value);
        entity.setFormula(formula);
    }

    private void validateCalculation(SalaryRuleDtos.ComputationType type, java.math.BigDecimal value, String formula) {
        if (type == SalaryRuleDtos.ComputationType.FORMULA && (formula == null || formula.isBlank())) {
            throw new IllegalArgumentException("Formula is required for FORMULA salary rules");
        }
        if (type != SalaryRuleDtos.ComputationType.FORMULA && value == null) {
            throw new IllegalArgumentException("Value is required for FIXED and PERCENTAGE salary rules");
        }
    }

    private void ensureCategory(String id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Salary rule category not found: " + id);
        }
    }

    private SalaryRule find(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salary rule not found: " + id));
    }

    private SalaryRuleDtos.Response toResponse(SalaryRule entity) {
        return new SalaryRuleDtos.Response(entity.getId(), entity.getName(), entity.getCode(), entity.getCategoryId(),
            entity.getSequence(), SalaryRuleDtos.ComputationType.valueOf(entity.getCalculationType()), entity.getValue(),
            entity.getFormula(), entity.getStatus(), entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
