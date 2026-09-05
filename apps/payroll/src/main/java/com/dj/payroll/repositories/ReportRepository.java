package com.dj.payroll.repositories;

import com.dj.payroll.entities.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReportRepository extends JpaRepository<Payslip, String> {
    List<Payslip> findAllByPeriodStartGreaterThanEqualAndPeriodEndLessThanEqualOrderByPeriodStartDescEmployeeIdAsc(
        LocalDateTime from, LocalDateTime to
    );
}
