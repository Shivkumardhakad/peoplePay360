package com.dj.payroll.services;

import com.dj.payroll.entities.Payrun;
import com.dj.payroll.entities.Payslip;
import com.dj.payroll.entities.SalaryRule;
import com.dj.payroll.entities.SalaryRuleCategory;
import com.dj.payroll.entities.SalaryStructureRule;
import com.dj.payroll.integration.HrContractClient;
import com.dj.payroll.repositories.PayrunRepository;
import com.dj.payroll.repositories.PayslipLineRepository;
import com.dj.payroll.repositories.PayslipRepository;
import com.dj.payroll.repositories.SalaryRuleCategoryRepository;
import com.dj.payroll.repositories.SalaryRuleRepository;
import com.dj.payroll.repositories.SalaryStructureRepository;
import com.dj.payroll.repositories.SalaryStructureRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrunServiceTest {
    @Mock private PayrunRepository payrunRepository;
    @Mock private PayslipRepository payslipRepository;
    @Mock private PayslipLineRepository payslipLineRepository;
    @Mock private SalaryStructureRepository structureRepository;
    @Mock private SalaryStructureRuleRepository structureRuleRepository;
    @Mock private SalaryRuleRepository ruleRepository;
    @Mock private SalaryRuleCategoryRepository categoryRepository;
    @Mock private HrContractClient hrContractClient;

    private PayrunService service;

    @BeforeEach
    void setUp() {
        service = new PayrunService(payrunRepository, payslipRepository, payslipLineRepository,
            structureRepository, structureRuleRepository, ruleRepository, categoryRepository, hrContractClient,
            new FormulaSalaryRuleEngine());
    }

    @Test
    void computeCreatesRoundedPayslipForActiveHrContract() {
        Payrun payrun = draftPayrun();
        SalaryStructureRule assignment = new SalaryStructureRule();
        assignment.setSalaryStructureId("structure-1");
        assignment.setSalaryRuleId("rule-1");
        assignment.setSequence(1);
        SalaryRule rule = new SalaryRule();
        rule.setId("rule-1");
        rule.setCode("BASIC");
        rule.setName("Basic salary");
        rule.setCategoryId("earning");
        rule.setSequence(1);
        rule.setCalculationType("PERCENTAGE");
        rule.setValue(new BigDecimal("100"));
        SalaryRuleCategory category = new SalaryRuleCategory();
        category.setId("earning");
        category.setType("EARNING");

        when(payrunRepository.findByIdForUpdate("payrun-1")).thenReturn(Optional.of(payrun));
        when(structureRuleRepository.findAllBySalaryStructureIdOrderBySequenceAsc("structure-1"))
            .thenReturn(List.of(assignment));
        when(ruleRepository.findById("rule-1")).thenReturn(Optional.of(rule));
        when(hrContractClient.findActiveContracts(payrun.getPeriodStart(), payrun.getPeriodEnd(), payrun.getSalaryStructureId()))
            .thenReturn(List.of(new HrContractClient.ContractSnapshot("contract-1", "employee-1", new BigDecimal("1234.567"))));
        when(payslipRepository.existsByPayrunIdAndEmployeeId("payrun-1", "employee-1")).thenReturn(false);
        when(categoryRepository.findById("earning")).thenReturn(Optional.of(category));
        when(payslipRepository.save(any(Payslip.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(payrunRepository.save(any(Payrun.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.compute("payrun-1");

        assertEquals("COMPUTED", payrun.getStatus());
        ArgumentCaptor<Payslip> payslipCaptor = ArgumentCaptor.forClass(Payslip.class);
        verify(payslipRepository).save(payslipCaptor.capture());
        assertEquals(new BigDecimal("1234.57"), payslipCaptor.getValue().getGrossAmount());
        assertEquals(new BigDecimal("1234.57"), payslipCaptor.getValue().getNetAmount());
        verify(hrContractClient).findActiveContracts(payrun.getPeriodStart(), payrun.getPeriodEnd(), payrun.getSalaryStructureId());
    }

    @Test
    void computeIsIdempotentForAlreadyComputedPayrun() {
        Payrun payrun = draftPayrun();
        payrun.setStatus("COMPUTED");
        when(payrunRepository.findByIdForUpdate("payrun-1")).thenReturn(Optional.of(payrun));
        when(payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc("payrun-1")).thenReturn(List.of());

        assertEquals("COMPUTED", service.compute("payrun-1").status());
    }

    @Test
    void computeRejectsOverlappingActiveContractsForOneEmployee() {
        Payrun payrun = draftPayrun();
        SalaryStructureRule assignment = new SalaryStructureRule();
        assignment.setSalaryStructureId("structure-1");
        assignment.setSalaryRuleId("rule-1");
        assignment.setSequence(1);
        SalaryRule rule = new SalaryRule();
        rule.setId("rule-1");
        rule.setCode("BASIC");
        rule.setCalculationType("FIXED");
        rule.setValue(new BigDecimal("1000"));
        when(payrunRepository.findByIdForUpdate("payrun-1")).thenReturn(Optional.of(payrun));
        when(structureRuleRepository.findAllBySalaryStructureIdOrderBySequenceAsc("structure-1")).thenReturn(List.of(assignment));
        when(ruleRepository.findById("rule-1")).thenReturn(Optional.of(rule));
        when(hrContractClient.findActiveContracts(payrun.getPeriodStart(), payrun.getPeriodEnd(), "structure-1"))
            .thenReturn(List.of(
                new HrContractClient.ContractSnapshot("contract-1", "employee-1", new BigDecimal("1000")),
                new HrContractClient.ContractSnapshot("contract-2", "employee-1", new BigDecimal("1200"))));
        assertThrows(IllegalArgumentException.class, () -> service.compute("payrun-1"));
    }

    @Test
    void validateReturnsWarningsForPayrunWithoutPayslips() {
        Payrun payrun = draftPayrun();
        payrun.setStatus("COMPUTED");
        when(payrunRepository.findByIdForUpdate("payrun-1")).thenReturn(Optional.of(payrun));
        when(payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc("payrun-1")).thenReturn(List.of());

        var result = service.validate("payrun-1");

        assertEquals("COMPUTED", result.status());
        assertEquals(true, result.warnings().contains("Payrun has no payslips"));
    }

    @Test
    void validateChecksTotalsAndHrContractScope() {
        Payrun payrun = draftPayrun();
        payrun.setStatus("COMPUTED");
        Payslip payslip = new Payslip();
        payslip.setId("payslip-1");
        payslip.setEmployeeId("employee-1");
        payslip.setContractId("contract-1");
        payslip.setPeriodStart(payrun.getPeriodStart());
        payslip.setPeriodEnd(payrun.getPeriodEnd());
        payslip.setGrossAmount(new BigDecimal("100.00"));
        payslip.setDeductionAmount(new BigDecimal("10.00"));
        payslip.setNetAmount(new BigDecimal("80.00"));
        when(payrunRepository.findByIdForUpdate("payrun-1")).thenReturn(Optional.of(payrun));
        when(payslipRepository.findAllByPayrunIdOrderByEmployeeIdAsc("payrun-1")).thenReturn(List.of(payslip));
        when(payslipLineRepository.findAllByPayslipIdOrderBySequenceAsc("payslip-1")).thenReturn(List.of());
        when(hrContractClient.findActiveContracts(payrun.getPeriodStart(), payrun.getPeriodEnd(), "structure-1"))
            .thenReturn(List.of(new HrContractClient.ContractSnapshot("contract-1", "employee-1", new BigDecimal("100"))));

        var result = service.validate("payrun-1");

        assertEquals("COMPUTED", result.status());
        assertEquals(true, result.warnings().stream().anyMatch(item -> item.contains("Net amount does not equal gross minus deductions")));
    }

    private Payrun draftPayrun() {
        Payrun payrun = new Payrun();
        payrun.setId("payrun-1");
        payrun.setSalaryStructureId("structure-1");
        payrun.setPeriodStart(LocalDateTime.of(2026, 9, 1, 0, 0));
        payrun.setPeriodEnd(LocalDateTime.of(2026, 9, 30, 23, 59));
        payrun.setStatus("DRAFT");
        payrun.setSelectedEmployeeIds(new java.util.LinkedHashSet<>(Set.of("employee-1")));
        return payrun;
    }
}
