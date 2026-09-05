package com.dj.payroll.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "PayslipLine")
@Getter
@Setter
@NoArgsConstructor
public class PayslipLine {
    @Id
    private String id;
    private String payslipId;
    private String salaryRuleId;
    private String code;
    private String name;
    private String categoryId;
    private int sequence;
    @Column(precision = 15, scale = 4)
    private BigDecimal quantity;
    @Column(precision = 15, scale = 4)
    private BigDecimal rate;
    @Column(precision = 15, scale = 2)
    private BigDecimal amount;
    private Instant createdAt;
}
