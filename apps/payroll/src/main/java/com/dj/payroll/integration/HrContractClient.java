package com.dj.payroll.integration;

import com.dj.payroll.exception.ExternalServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Component
public class HrContractClient {
    private final RestClient client;
    private final String jwtSecret;

    public HrContractClient(RestClient.Builder builder,
                            @Value("${peoplepay.hr-api-url}") String baseUrl,
                            @Value("${peoplepay.hr-api-jwt-secret:PeoplePay360-dev-jwt-secret-change-in-production-2026}") String jwtSecret) {
        this.client = builder.baseUrl(baseUrl).build();
        this.jwtSecret = jwtSecret;
    }

    public List<ContractSnapshot> findActiveContracts(LocalDateTime periodStart, LocalDateTime periodEnd) {
        return findActiveContracts(periodStart, periodEnd, null);
    }

    public List<ContractSnapshot> findActiveContracts(LocalDateTime periodStart, LocalDateTime periodEnd,
                                                      String salaryStructureId) {
        try {
            List<HrContractResponse> contracts = client.get()
                .uri("/contracts")
                .headers(headers -> headers.setBearerAuth(serviceToken()))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
            if (contracts == null) return List.of();
            Instant start = periodStart.toInstant(ZoneOffset.UTC);
            Instant end = periodEnd.toInstant(ZoneOffset.UTC);
            return contracts.stream()
                .filter(contract -> "ACTIVE".equals(contract.status()))
                .filter(contract -> contract.employee() == null || "ACTIVE".equals(contract.employee().status()))
                .filter(contract -> salaryStructureId == null || salaryStructureId.equals(contract.salaryStructureId()))
                .filter(contract -> !contract.startDate().isAfter(end))
                .filter(contract -> contract.endDate() == null || !contract.endDate().isBefore(start))
                .map(contract -> new ContractSnapshot(contract.id(), contract.employeeId(), contract.baseSalary(),
                    contract.salaryStructureId(), contract.employee() == null ? "ACTIVE" : contract.employee().status()))
                .toList();
        } catch (RuntimeException exception) {
            throw new ExternalServiceException("HR contract service is unavailable", exception);
        }
    }

    private record HrContractResponse(
        String id, String employeeId, Instant startDate, Instant endDate,
        BigDecimal baseSalary, String status, String salaryStructureId, EmployeeResponse employee
    ) {}

    private record EmployeeResponse(String id, String status) {}

    public record ContractSnapshot(String id, String employeeId, BigDecimal baseSalary,
                                   String salaryStructureId, String employeeStatus) {
        public ContractSnapshot(String id, String employeeId, BigDecimal baseSalary) {
            this(id, employeeId, baseSalary, null, "ACTIVE");
        }
    }

    public record PayrollContext(int workedMinutes, BigDecimal unpaidLeaveDays,
                                 int attendanceExceptions, boolean hasBankAccount) {}

    public Map<String, PayrollContext> findPayrollContext(LocalDateTime periodStart, LocalDateTime periodEnd,
                                                          Set<String> employeeIds) {
        if (employeeIds == null || employeeIds.isEmpty()) return Map.of();
        try {
            List<Map<String, Object>> bankAccounts = list("/bank-accounts");
            List<Map<String, Object>> attendance = list("/attendance");
            List<Map<String, Object>> timeOff = list("/time-off/requests");
            Map<String, Integer> workedMinutes = new HashMap<>();
            Map<String, Integer> exceptions = new HashMap<>();
            Map<String, BigDecimal> unpaidLeave = new HashMap<>();
            Set<String> bankedEmployees = new HashSet<>();

            for (Map<String, Object> account : bankAccounts) {
                String employeeId = nestedId(account.get("employee"));
                if (employeeIds.contains(employeeId)) bankedEmployees.add(employeeId);
            }
            for (Map<String, Object> entry : attendance) {
                String employeeId = string(entry.get("employeeId"));
                if (!employeeIds.contains(employeeId) || !inPeriod(entry.get("date"), periodStart, periodEnd)) continue;
                workedMinutes.merge(employeeId, integer(entry.get("workedMinutes")), Integer::sum);
                String status = string(entry.get("status"));
                if (Set.of("ABSENT", "LATE", "HALF_DAY", "EXCEPTION").contains(status)) {
                    exceptions.merge(employeeId, 1, Integer::sum);
                }
            }
            for (Map<String, Object> request : timeOff) {
                String employeeId = string(request.get("employeeId"));
                if (!employeeIds.contains(employeeId) || !"APPROVED".equals(string(request.get("status")))) continue;
                if (!inPeriod(request.get("startDate"), periodStart, periodEnd)) continue;
                Object type = request.get("timeOffType");
                boolean paid = type instanceof Map<?, ?> map && Boolean.TRUE.equals(map.get("paid"));
                if (!paid) unpaidLeave.merge(employeeId, decimal(request.get("quantity")), BigDecimal::add);
            }
            Map<String, PayrollContext> result = new HashMap<>();
            for (String employeeId : employeeIds) {
                result.put(employeeId, new PayrollContext(workedMinutes.getOrDefault(employeeId, 0),
                    unpaidLeave.getOrDefault(employeeId, BigDecimal.ZERO), exceptions.getOrDefault(employeeId, 0),
                    bankedEmployees.contains(employeeId)));
            }
            return result;
        } catch (RuntimeException exception) {
            throw new ExternalServiceException("HR payroll context service is unavailable", exception);
        }
    }

    private List<Map<String, Object>> list(String path) {
        List<Map<String, Object>> response = client.get().uri(path)
            .headers(headers -> headers.setBearerAuth(serviceToken()))
            .retrieve().body(new ParameterizedTypeReference<>() {});
        return response == null ? List.of() : response;
    }

    private boolean inPeriod(Object value, LocalDateTime start, LocalDateTime end) {
        if (value == null) return false;
        try {
            Instant instant = Instant.parse(value.toString());
            return !instant.isBefore(start.toInstant(ZoneOffset.UTC)) && !instant.isAfter(end.toInstant(ZoneOffset.UTC));
        } catch (RuntimeException ignored) { return false; }
    }

    private String nestedId(Object value) { return value instanceof Map<?, ?> map ? string(map.get("id")) : null; }
    private String string(Object value) { return value == null ? "" : value.toString(); }
    private int integer(Object value) { return value instanceof Number number ? number.intValue() : Integer.parseInt(string(value)); }
    private BigDecimal decimal(Object value) { return value instanceof Number number ? new BigDecimal(number.toString()) : new BigDecimal(string(value)); }

    private String serviceToken() {
        try {
            String header = encode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
            long now = Instant.now().getEpochSecond();
            String payload = encode("{\"sub\":\"payroll-service\",\"role\":\"HR_MANAGER\",\"iat\":" + now + ",\"exp\":" + (now + 300) + "}");
            String unsigned = header + "." + payload;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return unsigned + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(unsigned.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not create HR service token", exception);
        }
    }

    private String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }
}
