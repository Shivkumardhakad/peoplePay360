package com.dj.payroll.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "SalaryStructureRule", uniqueConstraints = @UniqueConstraint(name = "uk_structure_rule", columnNames = {"salaryStructureId", "salaryRuleId"}))
@Getter
@Setter
@NoArgsConstructor
public class SalaryStructureRule {
    @Id
    private String id;
    private String salaryStructureId;
    private String salaryRuleId;
    private int sequence;
    private Instant createdAt;
}
