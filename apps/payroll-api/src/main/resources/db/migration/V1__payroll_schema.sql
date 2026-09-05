CREATE TABLE salary_structures (
  id VARCHAR(191) PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL UNIQUE,
  description VARCHAR(512),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE salary_rules (
  id VARCHAR(191) PRIMARY KEY,
  salary_structure_id VARCHAR(191) NOT NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(191) NOT NULL,
  category VARCHAR(50) NOT NULL,
  sequence INT NOT NULL,
  computation_type VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2),
  percentage DECIMAL(8, 4),
  base_rule_codes VARCHAR(512),
  formula TEXT,
  taxable BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_salary_rules_structure FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id),
  CONSTRAINT uq_salary_rules_structure_code UNIQUE (salary_structure_id, code)
);

CREATE TABLE payruns (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  salary_structure_id VARCHAR(191) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payruns_structure FOREIGN KEY (salary_structure_id) REFERENCES salary_structures(id)
);

CREATE TABLE payslips (
  id VARCHAR(191) PRIMARY KEY,
  payrun_id VARCHAR(191) NOT NULL,
  employee_id VARCHAR(191) NOT NULL,
  contract_id VARCHAR(191) NOT NULL,
  gross_pay DECIMAL(12, 2) NOT NULL,
  net_pay DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payslips_payrun FOREIGN KEY (payrun_id) REFERENCES payruns(id),
  CONSTRAINT uq_payslips_payrun_employee UNIQUE (payrun_id, employee_id)
);

CREATE TABLE payslip_lines (
  id VARCHAR(191) PRIMARY KEY,
  payslip_id VARCHAR(191) NOT NULL,
  salary_rule_id VARCHAR(191),
  code VARCHAR(100) NOT NULL,
  name VARCHAR(191) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  sequence INT NOT NULL,
  CONSTRAINT fk_payslip_lines_payslip FOREIGN KEY (payslip_id) REFERENCES payslips(id),
  CONSTRAINT fk_payslip_lines_rule FOREIGN KEY (salary_rule_id) REFERENCES salary_rules(id)
);
