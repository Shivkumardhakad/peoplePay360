package com.dj.payroll.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "SalaryStructure")
@Getter
@Setter
@NoArgsConstructor
public class SalaryStructure {
    @Id
    private String id;
    private String name;
    private String code;
    private String description;
    private String status = "ACTIVE";
    private Instant createdAt;
    private Instant updatedAt;
}
