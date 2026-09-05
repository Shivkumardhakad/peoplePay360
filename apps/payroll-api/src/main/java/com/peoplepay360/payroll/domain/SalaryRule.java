package com.peoplepay360.payroll.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(
    name = "salary_rules",
    uniqueConstraints = @UniqueConstraint(columnNames = {"salary_structure_id", "code"}))
public class SalaryRule {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "salary_structure_id")
  private SalaryStructure salaryStructure;

  @Column(nullable = false)
  private String code;

  @Column(nullable = false)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private RuleCategory category;

  @Column(nullable = false)
  private int sequence;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private ComputationType computationType;

  private BigDecimal amount;
  private BigDecimal percentage;
  private String baseRuleCodes;
  private String formula;

  @Column(nullable = false)
  private boolean taxable;

  @Column(nullable = false)
  private boolean active = true;

  public String getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public RuleCategory getCategory() {
    return category;
  }

  public void setCategory(RuleCategory category) {
    this.category = category;
  }

  public int getSequence() {
    return sequence;
  }

  public void setSequence(int sequence) {
    this.sequence = sequence;
  }

  public ComputationType getComputationType() {
    return computationType;
  }

  public void setComputationType(ComputationType computationType) {
    this.computationType = computationType;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public void setAmount(BigDecimal amount) {
    this.amount = amount;
  }

  public BigDecimal getPercentage() {
    return percentage;
  }

  public void setPercentage(BigDecimal percentage) {
    this.percentage = percentage;
  }

  public String getBaseRuleCodes() {
    return baseRuleCodes;
  }

  public void setBaseRuleCodes(String baseRuleCodes) {
    this.baseRuleCodes = baseRuleCodes;
  }

  public String getFormula() {
    return formula;
  }

  public void setFormula(String formula) {
    this.formula = formula;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }
}
