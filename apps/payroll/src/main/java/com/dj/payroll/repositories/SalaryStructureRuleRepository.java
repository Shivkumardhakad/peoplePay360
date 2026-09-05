package com.dj.payroll.repositories;

import com.dj.payroll.entities.SalaryStructureRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryStructureRuleRepository extends JpaRepository<SalaryStructureRule, String> {
    List<SalaryStructureRule> findAllBySalaryStructureIdOrderBySequenceAsc(String salaryStructureId);
    boolean existsBySalaryStructureIdAndSalaryRuleId(String salaryStructureId, String salaryRuleId);
    void deleteAllBySalaryStructureId(String salaryStructureId);
}
