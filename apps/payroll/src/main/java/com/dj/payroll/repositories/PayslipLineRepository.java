package com.dj.payroll.repositories;

import com.dj.payroll.entities.PayslipLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayslipLineRepository extends JpaRepository<PayslipLine, String> {
    List<PayslipLine> findAllByPayslipIdOrderBySequenceAsc(String payslipId);
}
