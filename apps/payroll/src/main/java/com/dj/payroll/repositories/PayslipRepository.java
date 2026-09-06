package com.dj.payroll.repositories;

import com.dj.payroll.entities.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayslipRepository extends JpaRepository<Payslip, String> {
    List<Payslip> findAllByPayrunIdOrderByEmployeeIdAsc(String payrunId);
    List<Payslip> findAllByEmployeeIdOrderByPeriodStartDesc(String employeeId);
    boolean existsByPayrunIdAndEmployeeId(String payrunId, String employeeId);
}
