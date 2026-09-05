package com.dj.payroll.services;

import com.dj.payroll.dto.SalaryStructureDtos;
import com.dj.payroll.entities.SalaryStructure;
import com.dj.payroll.entities.SalaryStructureRule;
import com.dj.payroll.exception.ResourceNotFoundException;
import com.dj.payroll.repositories.SalaryRuleRepository;
import com.dj.payroll.repositories.SalaryStructureRepository;
import com.dj.payroll.repositories.SalaryStructureRuleRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SalaryStructureService {
    private final SalaryStructureRepository repository;
    private final SalaryStructureRuleRepository structureRuleRepository;
    private final SalaryRuleRepository salaryRuleRepository;

    public SalaryStructureService(SalaryStructureRepository repository,
                                  SalaryStructureRuleRepository structureRuleRepository,
                                  SalaryRuleRepository salaryRuleRepository) {
        this.repository = repository;
        this.structureRuleRepository = structureRuleRepository;
        this.salaryRuleRepository = salaryRuleRepository;
    }

    @Transactional(readOnly = true)
    public List<SalaryStructureDtos.Response> list() {
        return repository.findAllByOrderByNameAsc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SalaryStructureDtos.Response get(String id) { return toResponse(find(id)); }

    public SalaryStructureDtos.Response create(SalaryStructureDtos.CreateRequest request) {
        if (repository.existsByCode(request.code())) {
            throw new DataIntegrityViolationException("Salary structure code already exists: " + request.code());
        }
        validateRules(request.rules());
        SalaryStructure entity = new SalaryStructure();
        entity.setId(UUID.randomUUID().toString());
        entity.setName(request.name().trim());
        entity.setCode(request.code().trim().toUpperCase());
        entity.setDescription(request.description());
        entity.setStatus("ACTIVE");
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        SalaryStructure saved = repository.save(entity);
        saveRules(saved.getId(), request.rules());
        return toResponse(saved);
    }

    public SalaryStructureDtos.Response update(String id, SalaryStructureDtos.UpdateRequest request) {
        SalaryStructure entity = find(id);
        validateRules(request.rules());
        entity.setName(request.name().trim());
        entity.setDescription(request.description());
        entity.setStatus(request.status().toUpperCase());
        entity.setUpdatedAt(Instant.now());
        SalaryStructure saved = repository.save(entity);
        structureRuleRepository.deleteAllBySalaryStructureId(id);
        structureRuleRepository.flush();
        saveRules(saved.getId(), request.rules());
        return toResponse(saved);
    }

    private void validateRules(List<SalaryStructureDtos.RuleAssignment> rules) {
        long distinctRules = rules.stream().map(SalaryStructureDtos.RuleAssignment::salaryRuleId).distinct().count();
        if (distinctRules != rules.size()) {
            throw new IllegalArgumentException("A salary rule cannot be added twice to one structure");
        }
        rules.forEach(rule -> {
            if (!salaryRuleRepository.existsById(rule.salaryRuleId())) {
                throw new ResourceNotFoundException("Salary rule not found: " + rule.salaryRuleId());
            }
        });
    }

    private void saveRules(String structureId, List<SalaryStructureDtos.RuleAssignment> rules) {
        List<SalaryStructureRule> assignments = rules.stream().map(rule -> {
            SalaryStructureRule entity = new SalaryStructureRule();
            entity.setId(UUID.randomUUID().toString());
            entity.setSalaryStructureId(structureId);
            entity.setSalaryRuleId(rule.salaryRuleId());
            entity.setSequence(rule.sequence());
            entity.setCreatedAt(Instant.now());
            return entity;
        }).toList();
        structureRuleRepository.saveAll(assignments);
    }

    private SalaryStructure find(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Salary structure not found: " + id));
    }

    private SalaryStructureDtos.Response toResponse(SalaryStructure entity) {
        List<SalaryStructureDtos.RuleResponse> rules = structureRuleRepository
            .findAllBySalaryStructureIdOrderBySequenceAsc(entity.getId()).stream()
            .map(rule -> new SalaryStructureDtos.RuleResponse(rule.getSalaryRuleId(), rule.getSequence()))
            .toList();
        return new SalaryStructureDtos.Response(entity.getId(), entity.getName(), entity.getCode(), entity.getDescription(),
            entity.getStatus(), rules, entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
