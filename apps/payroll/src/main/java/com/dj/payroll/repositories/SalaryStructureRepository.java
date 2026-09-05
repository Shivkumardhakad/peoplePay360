package com.dj.payroll.repositories;

import com.dj.payroll.entities.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, String> {
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, String id);
    List<SalaryStructure> findAllByOrderByNameAsc();
}
