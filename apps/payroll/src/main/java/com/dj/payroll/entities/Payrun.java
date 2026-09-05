package com.dj.payroll.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "Payrun")
@Getter
@Setter
@NoArgsConstructor
public class Payrun {
    @Id
    private String id;
    private String name;
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
    private String salaryStructureId;
    private String status = "DRAFT";
    private Instant computedAt;
    private Instant validatedAt;
    private Instant paidAt;
    private String createdById;
    private Instant createdAt;
    private Instant updatedAt;
}
