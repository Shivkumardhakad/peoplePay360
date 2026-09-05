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
import java.util.List;
import java.util.Arrays;
import java.util.Collections;
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

    public PayrunService(PayrunRepository payrunRepository, PayslipRepository payslipRepository,
                         PayslipLineRepository payslipLineRepository, SalaryStructureRepository structureRepository,
                         SalaryStructureRuleRepository structureRuleRepository, SalaryRuleRepository ruleRepository,
                         SalaryRuleCategoryRepository categoryRepository, HrContractClient hrContractClient) {
        this.payrunRepository = payrunRepository;
        this.payslipRepository = payslipRepository;
        this.payslipLineRepository = payslipLineRepository;
        this.structureRepository = structureRepository;
        this.structureRuleRepository = structureRuleRepository;
        this.ruleRepository = ruleRepository;
        this.categoryRepository = categoryRepository;
        this.hrContractClient = hrContractClient;
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
        if (!structureRepository.existsById(request.salaryStructureId())) {
            throw new ResourceNotFoundException("Salary structure not found: " + request.salaryStructureId());
        }
        Payrun entity = new Payrun();
        entity.setId(UUID.randomUUID().toString());
        entity.setName(request.name().trim());
        entity.setPeriodStart(request.periodStart());
        entity.setPeriodEnd(request.periodEnd());
        entity.setSalaryStructureId(request.salaryStructureId());
        entity.setSelectedEmployeeIds(request.selectedEmployeeIds() == null ? null : String.join(",", request.selectedEmployeeIds().stream().distinct().toList()));
        entity.setStatus("DRAFT");
        entity.setCreatedById(createdById);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
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
            .sorted(Comparator.comparingInt(SalaryRule::getSequence).thenComparing(SalaryRule::getCode))
            .toList();

        List<HrContractClient.ContractSnapshot> contracts = hrContractClient
            .findActiveContracts(payrun.getPeriodStart(), payrun.getPeriodEnd());
        List<String> selectedEmployeeIds = selectedEmployeeIds(payrun);
        if (!selectedEmployeeIds.isEmpty()) {
            contracts = contracts.stream().filter(contract -> selectedEmployeeIds.contains(contract.employeeId())).toList();
        }
        if (contracts.isEmpty()) {
            throw new IllegalArgumentException(selectedEmployeeIds.isEmpty()
                ? "No active contracts found for the payrun period"
                : "No selected employees have active contracts for the payrun period");
        }

        for (HrContractClient.ContractSnapshot contract : contracts) {
            String employeeId = contract.employeeId();
            if (payslipRepository.existsByPayrunIdAndEmployeeId(payrun.getId(), employeeId)) {
                throw new IllegalArgumentException("Duplicate payslip detected for employee: " + employeeId);
            }
            BigDecimal baseSalary = contract.baseSalary().setScale(MONEY_SCALE, ROUNDING);
            createPayslip(payrun, contract.id(), employeeId, baseSalary, rules);
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
        payslips.forEach(payslip -> {
            if (payslip.getNetAmount().compareTo(BigDecimal.ZERO) < 0) {
                warnings.add("Negative net amount for employee " + payslip.getEmployeeId());
            }
        });
        if (!warnings.isEmpty()) throw new IllegalArgumentException(String.join("; ", warnings));
        payrun.setStatus("VALIDATED");
        payrun.setValidatedAt(Instant.now());
        payrun.setUpdatedAt(Instant.now());
        payrunRepository.save(payrun);
        return new PayrunDtos.ValidationResponse(id, payrun.getStatus(), warnings);
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
                               BigDecimal baseSalary, List<SalaryRule> rules) {
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;
        List<PayslipLine> lines = new ArrayList<>();
        for (SalaryRule rule : rules) {
            var category = categoryRepository.findById(rule.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Salary rule category not found: " + rule.getCategoryId()));
            BigDecimal amount = calculate(rule, baseSalary).setScale(MONEY_SCALE, ROUNDING);
            if ("EARNING".equals(category.getType())) gross = gross.add(amount);
            if ("DEDUCTION".equals(category.getType())) deductions = deductions.add(amount);
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

    private BigDecimal calculate(SalaryRule rule, BigDecimal baseSalary) {
        return switch (rule.getCalculationType()) {
            case "FIXED" -> requireValue(rule);
            case "PERCENTAGE" -> baseSalary.multiply(requireValue(rule)).divide(BigDecimal.valueOf(100), 8, ROUNDING);
            case "FORMULA" -> throw new IllegalArgumentException("FORMULA salary rules require a configured formula engine: " + rule.getCode());
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
            entity.getSalaryStructureId(), selectedEmployeeIds(entity), entity.getStatus(), entity.getComputedAt(), entity.getValidatedAt(),
            entity.getPaidAt(), payslips, entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private List<String> selectedEmployeeIds(Payrun payrun) {
        if (payrun.getSelectedEmployeeIds() == null || payrun.getSelectedEmployeeIds().isBlank()) return Collections.emptyList();
        return Arrays.stream(payrun.getSelectedEmployeeIds().split(",")).filter(value -> !value.isBlank()).toList();
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
