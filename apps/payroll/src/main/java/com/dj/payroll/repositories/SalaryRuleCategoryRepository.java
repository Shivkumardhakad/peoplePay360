package com.dj.payroll.repositories;

import com.dj.payroll.entities.SalaryRuleCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SalaryRuleCategoryRepository extends JpaRepository<SalaryRuleCategory, String> {
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, String id);
    Optional<SalaryRuleCategory> findByCode(String code);
}
