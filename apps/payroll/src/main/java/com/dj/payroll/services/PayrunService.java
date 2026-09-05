package com.dj.payroll.services;

import com.dj.payroll.dto.PayrunDtos;
import com.dj.payroll.dto.PayslipDtos;
import com.dj.payroll.entities.Payrun;
import com.dj.payroll.entities.Payslip;
import com.dj.payroll.entities.PayslipLine;
import com.dj.payroll.entities.SalaryRule;
import com.dj.payroll.entities.SalaryStructureRule;
import com.dj.payroll.exception.ResourceNotFoundException;
import com.dj.payroll.integration.HrContractClient;
import com.dj.payroll.repositories.PayrunRepository;
import com.dj.payroll.repositories.PayslipLineRepository;
import com.dj.payroll.repositories.PayslipRepository;
import com.dj.payroll.repositories.SalaryRuleCategoryRepository;
import com.dj.payroll.repositories.SalaryRuleRepository;
import com.dj.payroll.repositories.SalaryStructureRepository;
import com.dj.payroll.repositories.SalaryStructureRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.UUID;

@Service
@Transactional
public class PayrunService {
    private static final int MONEY_SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private final PayrunRepository payrunRepository;
    private final PayslipRepository payslipRepository;
    private final PayslipLineRepository payslipLineRepository;
    private final SalaryStructureRepository structureRepository;
    private final SalaryStructureRuleRepository structureRuleRepository;
    private final SalaryRuleRepository ruleRepository;
    private final SalaryRuleCategoryRepository categoryRepository;

    private final HrContractClient hrContractClient;
    private final FormulaSalaryRuleEngine formulaEngine;

    public PayrunService(PayrunRepository payrunRepository, PayslipRepository payslipRepository,
                         PayslipLineRepository payslipLineRepository, SalaryStructureRepository structureRepository,
                         SalaryStructureRuleRepository structureRuleRepository, SalaryRuleRepository ruleRepository,
                         SalaryRuleCategoryRepository categoryRepository, HrContractClient hrContractClient,
                         FormulaSalaryRuleEngine formulaEngine) {
        this.payrunRepository = payrunRepository;
        this.payslipRepository = payslipRepository;
        this.payslipLineRepository = payslipLineRepository;
        this.structureRepository = structureRepository;
        this.structureRuleRepository = structureRuleRepository;
        this.ruleRepository = ruleRepository;
        this.categoryRepository = categoryRepository;
        this.hrContractClient = hrContractClient;
        this.formulaEngine = formulaEngine;
    }

    @Transactional(readOnly = true)
    public List<PayrunDtos.Response> list() {
        return payrunRepository.findAllByOrderByPeriodStartDescCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PayrunDtos.Response get(String id) { return toResponse(find(id)); }

    public PayrunDtos.Response create(PayrunDtos.CreateRequest request, String createdById) {
        if (!request.periodEnd().isAfter(request.periodStart())) {
            throw new IllegalArgumentException("Payrun periodEnd must be after periodStart");
        }
        if (request.employeeIds().stream().distinct().count() != request.employeeIds().size()) {
            throw new IllegalArgumentException("An employee cannot be selected more than once");
        }
        if (!structureRepository.existsById(request.salaryStructureId())) {
            throw new ResourceNotFoundException("Salary structure not found: " + request.salaryStructureId());
        }
        var structure = structureRepository.findById(request.salaryStructureId()).orElseThrow();
        if (!"ACTIVE".equals(structure.getStatus())) {
            throw new IllegalArgumentException("Salary structure is inactive: " + request.salaryStructureId());
        }
        Payrun entity = new Payrun();
        entity.setId(UUID.randomUUID().toString());
        entity.setName(request.name().trim());
        entity.setPeriodStart(request.periodStart());
        entity.setPeriodEnd(request.periodEnd());
        entity.setSalaryStructureId(request.salaryStructureId());
        entity.setStatus("DRAFT");
        entity.setCreatedById(createdById);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        entity.setSelectedEmployeeIds(new LinkedHashSet<>(request.employeeIds()));
        return toResponse(payrunRepository.save(entity));
    }

    public PayrunDtos.Response compute(String id) {
        Payrun payrun = findForUpdate(id);
        requireStatus(payrun, "DRAFT");
        List<SalaryStructureRule> assignments = structureRuleRepository
            .findAllBySalaryStructureIdOrderBySequenceAsc(payrun.getSalaryStructureId());
        if (assignments.isEmpty()) {
            throw new IllegalArgumentException("Salary structure has no salary rules");
        }
        List<SalaryRule> rules = assignments.stream().map(item -> ruleRepository.findById(item.getSalaryRuleId())
            .orElseThrow(() -> new ResourceNotFoundException("Salary rule not found: " + item.getSalaryRuleId())))
            .filter(rule -> "ACTIVE".equals(rule.getStatus()))
            .sorted(Comparator.comparingInt(SalaryRule::getSequence).thenComparing(SalaryRule::getCode))
            .toList();
        if (rules.isEmpty()) {
            throw new IllegalArgumentException("Salary structure has no active salary rules");
        }

        List<HrContractClient.ContractSnapshot> contracts = hrContractClient
            .findActiveContracts(payrun.getPeriodStart(), payrun.getPeriodEnd(), payrun.getSalaryStructureId());
        Set<String> selectedEmployeeIds = payrun.getSelectedEmployeeIds() == null
            ? Set.of() : new HashSet<>(payrun.getSelectedEmployeeIds());
        if (selectedEmployeeIds.isEmpty()) {
            throw new IllegalArgumentException("At least one employee must be selected for the payrun");
        }
        contracts = contracts.stream().filter(contract -> selectedEmployeeIds.contains(contract.employeeId())).toList();
        Set<String> foundEmployeeIds = contracts.stream().map(HrContractClient.ContractSnapshot::employeeId).collect(java.util.stream.Collectors.toSet());
        if (!foundEmployeeIds.equals(selectedEmployeeIds)) {
            Set<String> missing = new HashSet<>(selectedEmployeeIds);
            missing.removeAll(foundEmployeeIds);
            throw new IllegalArgumentException("No applicable active contract found for selected employees: " + missing);
        }
        if (contracts.isEmpty()) {
            throw new IllegalArgumentException("No active contracts found for the payrun period");
        }

        var employeeIds = new java.util.HashSet<String>();
        for (var contract : contracts) {
            if (!employeeIds.add(contract.employeeId())) {
                throw new IllegalArgumentException("Overlapping active contracts found for employee: " + contract.employeeId());
            }
            if (!"ACTIVE".equals(contract.employeeStatus())) {
                throw new IllegalArgumentException("Employee is not active: " + contract.employeeId());
            }
            if (contract.baseSalary() == null || contract.baseSalary().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Contract has an invalid base salary: " + contract.id());
            }
        }

        Map<String, HrContractClient.PayrollContext> payrollContext = hrContractClient
            .findPayrollContext(payrun.getPeriodStart(), payrun.getPeriodEnd(), selectedEmployeeIds);
        for (HrContractClient.ContractSnapshot contract : contracts) {
            String employeeId = contract.employeeId();
            if (payslipRepository.existsByPayrunIdAndEmployeeId(payrun.getId(), employeeId)) {
                throw new IllegalArgumentException("Duplicate payslip detected for employee: " + employeeId);
            }
            BigDecimal baseSalary = contract.baseSalary().setScale(MONEY_SCALE, ROUNDING);
            createPayslip(payrun, contract.id(), employeeId, baseSalary, rules,
                payrollContext == null ? null : payrollContext.get(employeeId));
        }
        payrun.setStatus("COMPUTED");
        payrun.setComputedAt(Instant.now());
        payrun.setUpdatedAt(Instant.now());
        return toResponse(payrunRepository.save(payrun));
    }

    public PayrunDtos.ValidationResponse validate(String id) {
        Payrun payrun = findForUpdate(id);
        requireStatus(payrun, "COMPUTED");
        List<Payslip> payslips = payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc(id);
        List<String> warnings = new ArrayList<>();
        if (payslips.isEmpty()) warnings.add("Payrun has no payslips");
        Set<String> payslipEmployees = new HashSet<>();
        for (Payslip payslip : payslips) validatePayslip(payrun, payslip, payslipEmployees, warnings);
        if (!payslips.isEmpty()) validateContractScope(payrun, payslipEmployees, warnings);
        validatePayrollContext(payrun, payslipEmployees, warnings);
        if (!warnings.isEmpty()) {
            return new PayrunDtos.ValidationResponse(id, payrun.getStatus(), warnings);
        }
        payrun.setStatus("VALIDATED");
        payrun.setValidatedAt(Instant.now());
        payrun.setUpdatedAt(Instant.now());
        payrunRepository.save(payrun);
        return new PayrunDtos.ValidationResponse(id, payrun.getStatus(), warnings);
    }

    private void validatePayslip(Payrun payrun, Payslip payslip, Set<String> employees, List<String> warnings) {
        if (payslip.getEmployeeId() == null || !employees.add(payslip.getEmployeeId())) {
            warnings.add("Duplicate or missing employee on payslip " + payslip.getId());
        }
        if (!payrun.getPeriodStart().equals(payslip.getPeriodStart()) || !payrun.getPeriodEnd().equals(payslip.getPeriodEnd())) {
            warnings.add("Payslip period does not match payrun for employee " + payslip.getEmployeeId());
        }
        if (payslip.getContractId() == null || payslip.getContractId().isBlank()) {
            warnings.add("Missing contract on payslip for employee " + payslip.getEmployeeId());
        }
        if (payslip.getGrossAmount() == null || payslip.getDeductionAmount() == null || payslip.getNetAmount() == null) {
            warnings.add("Missing payroll total for employee " + payslip.getEmployeeId());
            return;
        }
        if (payslip.getNetAmount().compareTo(BigDecimal.ZERO) < 0) {
            warnings.add("Negative net amount for employee " + payslip.getEmployeeId());
        }
        if (payslip.getGrossAmount().compareTo(BigDecimal.ZERO) < 0 || payslip.getDeductionAmount().compareTo(BigDecimal.ZERO) < 0) {
            warnings.add("Negative gross or deduction amount for employee " + payslip.getEmployeeId());
        }
        if (payslip.getGrossAmount().subtract(payslip.getDeductionAmount()).compareTo(payslip.getNetAmount()) != 0) {
            warnings.add("Net amount does not equal gross minus deductions for employee " + payslip.getEmployeeId());
        }
        List<PayslipLine> lines = payslipLineRepository.findAllByPayslipIdOrderBySequenceAsc(payslip.getId());
        if (lines.isEmpty()) {
            warnings.add("No salary-rule lines for employee " + payslip.getEmployeeId());
        } else {
            BigDecimal lineTotal = lines.stream()
                .filter(line -> {
                    String type = categoryRepository.findById(line.getCategoryId()).map(category -> category.getType()).orElse("");
                    return "EARNING".equals(type) || "DEDUCTION".equals(type);
                })
                .map(PayslipLine::getAmount).filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (lineTotal.compareTo(payslip.getGrossAmount().subtract(payslip.getDeductionAmount())) != 0) {
                warnings.add("Salary-rule line total does not match payslip totals for employee " + payslip.getEmployeeId());
            }
        }
    }

    private void validateContractScope(Payrun payrun, Set<String> payslipEmployees, List<String> warnings) {
        List<HrContractClient.ContractSnapshot> contracts = hrContractClient.findActiveContracts(
            payrun.getPeriodStart(), payrun.getPeriodEnd(), payrun.getSalaryStructureId());
        Set<String> contractEmployees = contracts.stream().map(HrContractClient.ContractSnapshot::employeeId).collect(java.util.stream.Collectors.toSet());
        Set<String> selectedEmployees = payrun.getSelectedEmployeeIds() == null ? Set.of() : payrun.getSelectedEmployeeIds();
        if (!contractEmployees.equals(selectedEmployees)) {
            Set<String> missingContracts = new HashSet<>(selectedEmployees);
            missingContracts.removeAll(contractEmployees);
            if (!missingContracts.isEmpty()) warnings.add("Selected employees missing applicable contracts: " + missingContracts);
        }
        if (!selectedEmployees.equals(payslipEmployees)) {
            Set<String> missing = new HashSet<>(selectedEmployees);
            missing.removeAll(payslipEmployees);
            Set<String> unexpected = new HashSet<>(payslipEmployees);
            unexpected.removeAll(selectedEmployees);
            if (!missing.isEmpty()) warnings.add("Missing payslips for active contract employees: " + missing);
            if (!unexpected.isEmpty()) warnings.add("Payslips have no matching active contract: " + unexpected);
        }
    }

    private void validatePayrollContext(Payrun payrun, Set<String> employees, List<String> warnings) {
        Map<String, HrContractClient.PayrollContext> contexts = hrContractClient.findPayrollContext(
            payrun.getPeriodStart(), payrun.getPeriodEnd(), employees);
        if (contexts == null) return;
        contexts.forEach((employeeId, context) -> {
            if (!context.hasBankAccount()) warnings.add("Missing bank account for employee " + employeeId);
            if (context.attendanceExceptions() > 0) warnings.add("Attendance exceptions for employee " + employeeId + ": " + context.attendanceExceptions());
            if (context.unpaidLeaveDays().compareTo(BigDecimal.ZERO) > 0) {
                warnings.add("Unpaid leave days for employee " + employeeId + ": " + context.unpaidLeaveDays());
            }
        });
    }

    public PayrunDtos.Response markPaid(String id) {
        Payrun payrun = findForUpdate(id);
        requireStatus(payrun, "VALIDATED");
        payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc(id).forEach(payslip -> {
            payslip.setStatus("PAID");
            payslip.setUpdatedAt(Instant.now());
            payslipRepository.save(payslip);
        });
        payrun.setStatus("PAID");
        payrun.setPaidAt(Instant.now());
        payrun.setUpdatedAt(Instant.now());
        return toResponse(payrunRepository.save(payrun));
    }

    public PayrunDtos.Response cancel(String id) {
        Payrun payrun = findForUpdate(id);
        if ("PAID".equals(payrun.getStatus()) || "CANCELLED".equals(payrun.getStatus())) {
            throw new IllegalArgumentException("Payrun cannot be cancelled in status " + payrun.getStatus());
        }
        payrun.setStatus("CANCELLED");
        payrun.setUpdatedAt(Instant.now());
        return toResponse(payrunRepository.save(payrun));
    }

    @Transactional(readOnly = true)
    public PayslipDtos.Response getPayslip(String id) {
        Payslip payslip = payslipRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payslip not found: " + id));
        return toPayslipResponse(payslip);
    }

    @Transactional(readOnly = true)
    public List<PayslipDtos.Response> listPayslips(String payrunId) {
        if (!payrunRepository.existsById(payrunId)) throw new ResourceNotFoundException("Payrun not found: " + payrunId);
        return payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc(payrunId).stream().map(this::toPayslipResponse).toList();
    }

    private void createPayslip(Payrun payrun, String contractId, String employeeId,
                               BigDecimal baseSalary, List<SalaryRule> rules,
                               HrContractClient.PayrollContext payrollContext) {
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;
        Map<String, BigDecimal> variables = new HashMap<>();
        variables.put("base_salary", baseSalary);
        variables.put("basesalary", baseSalary);
        if (payrollContext != null) {
            variables.put("worked_minutes", BigDecimal.valueOf(payrollContext.workedMinutes()));
            variables.put("unpaid_leave_days", payrollContext.unpaidLeaveDays());
            variables.put("attendance_exceptions", BigDecimal.valueOf(payrollContext.attendanceExceptions()));
        }
        List<PayslipLine> lines = new ArrayList<>();
        for (SalaryRule rule : rules) {
            var category = categoryRepository.findById(rule.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Salary rule category not found: " + rule.getCategoryId()));
            variables.put("gross", gross);
            variables.put("deductions", deductions);
            variables.put("net", gross.subtract(deductions));
            BigDecimal amount = calculate(rule, baseSalary, variables).setScale(MONEY_SCALE, ROUNDING);
            if ("EARNING".equals(category.getType())) gross = gross.add(amount);
            if ("DEDUCTION".equals(category.getType())) deductions = deductions.add(amount);
            variables.put(rule.getCode(), amount);
            variables.put(rule.getCode().toLowerCase(), amount);
            PayslipLine line = new PayslipLine();
            line.setId(UUID.randomUUID().toString());
            line.setCode(rule.getCode());
            line.setName(rule.getName());
            line.setSalaryRuleId(rule.getId());
            line.setCategoryId(rule.getCategoryId());
            line.setSequence(rule.getSequence());
            line.setQuantity(BigDecimal.ONE);
            line.setRate(rule.getValue());
            line.setAmount(amount);
            line.setCreatedAt(Instant.now());
            lines.add(line);
        }
        Payslip payslip = new Payslip();
        payslip.setId(UUID.randomUUID().toString());
        payslip.setPayrunId(payrun.getId());
        payslip.setEmployeeId(employeeId);
        payslip.setContractId(contractId);
        payslip.setPeriodStart(payrun.getPeriodStart());
        payslip.setPeriodEnd(payrun.getPeriodEnd());
        payslip.setGrossAmount(gross.setScale(MONEY_SCALE, ROUNDING));
        payslip.setDeductionAmount(deductions.setScale(MONEY_SCALE, ROUNDING));
        payslip.setNetAmount(gross.subtract(deductions).setScale(MONEY_SCALE, ROUNDING));
        payslip.setStatus("COMPUTED");
        payslip.setCreatedAt(Instant.now());
        payslip.setUpdatedAt(Instant.now());
        Payslip saved = payslipRepository.save(payslip);
        lines.forEach(line -> line.setPayslipId(saved.getId()));
        payslipLineRepository.saveAll(lines);
    }

    private BigDecimal calculate(SalaryRule rule, BigDecimal baseSalary, Map<String, BigDecimal> variables) {
        return switch (rule.getCalculationType()) {
            case "FIXED" -> requireValue(rule);
            case "PERCENTAGE" -> baseSalary.multiply(requireValue(rule)).divide(BigDecimal.valueOf(100), 8, ROUNDING);
            case "FORMULA" -> formulaEngine.evaluate(rule.getFormula(), variables);
            default -> throw new IllegalArgumentException("Unsupported salary rule type: " + rule.getCalculationType());
        };
    }

    private BigDecimal requireValue(SalaryRule rule) {
        if (rule.getValue() == null) throw new IllegalArgumentException("Salary rule has no value: " + rule.getCode());
        return rule.getValue();
    }

    private void requireStatus(Payrun payrun, String expected) {
        if (!expected.equals(payrun.getStatus())) {
            throw new IllegalArgumentException("Payrun must be in " + expected + " status, current status is " + payrun.getStatus());
        }
    }

    private Payrun find(String id) {
        return payrunRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Payrun not found: " + id));
    }

    private Payrun findForUpdate(String id) {
        return payrunRepository.findByIdForUpdate(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payrun not found: " + id));
    }

    private PayrunDtos.Response toResponse(Payrun entity) {
        List<PayrunDtos.PayslipSummary> payslips = payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc(entity.getId()).stream()
            .map(p -> new PayrunDtos.PayslipSummary(p.getId(), p.getEmployeeId(), p.getGrossAmount(),
                p.getDeductionAmount(), p.getNetAmount(), p.getStatus())).toList();
        return new PayrunDtos.Response(entity.getId(), entity.getName(), entity.getPeriodStart(), entity.getPeriodEnd(),
            entity.getSalaryStructureId(), entity.getStatus(), entity.getComputedAt(), entity.getValidatedAt(),
            entity.getPaidAt(), payslips,
            entity.getSelectedEmployeeIds() == null ? List.of() : entity.getSelectedEmployeeIds().stream().sorted().toList(),
            entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private PayslipDtos.Response toPayslipResponse(Payslip entity) {
        List<PayslipDtos.LineResponse> lines = payslipLineRepository.findAllByPayslipIdOrderBySequenceAsc(entity.getId()).stream()
            .map(line -> new PayslipDtos.LineResponse(line.getId(), line.getSalaryRuleId(), line.getCode(), line.getName(),
                line.getCategoryId(), line.getSequence(), line.getQuantity(), line.getRate(), line.getAmount(), line.getCreatedAt())).toList();
        return new PayslipDtos.Response(entity.getId(), entity.getPayrunId(), entity.getEmployeeId(), entity.getContractId(),
            entity.getPeriodStart(), entity.getPeriodEnd(), entity.getGrossAmount(), entity.getDeductionAmount(),
            entity.getNetAmount(), entity.getStatus(), lines, entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
