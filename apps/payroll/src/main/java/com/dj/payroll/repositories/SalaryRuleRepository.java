package com.dj.payroll.repositories;

import com.dj.payroll.entities.SalaryRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryRuleRepository extends JpaRepository<SalaryRule, String> {
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, String id);
    List<SalaryRule> findAllByOrderBySequenceAscCodeAsc();
    List<SalaryRule> findAllByCategoryIdOrderBySequenceAscCodeAsc(String categoryId);
}
