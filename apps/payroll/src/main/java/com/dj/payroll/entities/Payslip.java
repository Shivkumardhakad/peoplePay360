package com.dj.payroll.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "Payslip", uniqueConstraints = @UniqueConstraint(name = "uk_payslip_payrun_employee", columnNames = {"payrunId", "employeeId"}))
@Getter
@Setter
@NoArgsConstructor
public class Payslip {
    @Id
    private String id;
    private String payrunId;
    private String employeeId;
    private String contractId;
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    private BigDecimal grossAmount;
    private BigDecimal deductionAmount;
    private BigDecimal netAmount;
    private String status = "DRAFT";
    private String pdfPath;
    private Instant createdAt;
    private Instant updatedAt;
}
