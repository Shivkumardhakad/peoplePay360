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
import java.util.List;
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
                .filter(contract -> salaryStructureId == null || contract.salaryStructureId() == null
                    || salaryStructureId.equals(contract.salaryStructureId()))
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
