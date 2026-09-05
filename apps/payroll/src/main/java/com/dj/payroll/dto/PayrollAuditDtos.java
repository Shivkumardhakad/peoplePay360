package com.dj.payroll.dto;

import java.util.List;

public final class PayrollAuditDtos {
    private PayrollAuditDtos() {}

    public record Finding(String severity, String code, String message, String payslipId, String employeeId) {}

    public record Response(
        String payrunId, String status, String auditorVersion, boolean passed,
        int riskScore, List<Finding> findings
    ) {}
}
