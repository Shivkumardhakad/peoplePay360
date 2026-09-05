package com.dj.payroll.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "SalaryRule")
@Getter
@Setter
@NoArgsConstructor
public class SalaryRule {
    @Id
    private String id;
    private String name;
    private String code;
    private String categoryId;
    private int sequence;
    private String calculationType;
    private BigDecimal value;
    private String formula;
    private String status = "ACTIVE";
    private Instant createdAt;
    private Instant updatedAt;
}
