package com.dj.payroll.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "PayrunEmployee", joinColumns = @JoinColumn(name = "payrunId"))
    @Column(name = "employeeId", nullable = false)
    private Set<String> selectedEmployeeIds = new LinkedHashSet<>();
}
