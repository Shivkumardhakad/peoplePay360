package com.dj.payroll.integration;

import com.dj.payroll.exception.ExternalServiceException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Component
public class HrContractClient {
    private final RestClient client;

    public HrContractClient(RestClient.Builder builder,
                            @Value("${peoplepay.hr-api-url}") String baseUrl) {
        this.client = builder.baseUrl(baseUrl).build();
    }

    public List<ContractSnapshot> findActiveContracts(LocalDateTime periodStart, LocalDateTime periodEnd) {
        try {
            List<HrContractResponse> contracts = client.get()
                .uri("/contracts")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
            if (contracts == null) return List.of();
            Instant start = periodStart.toInstant(ZoneOffset.UTC);
            Instant end = periodEnd.toInstant(ZoneOffset.UTC);
            return contracts.stream()
                .filter(contract -> "ACTIVE".equals(contract.status()))
                .filter(contract -> !contract.startDate().isAfter(end))
                .filter(contract -> contract.endDate() == null || !contract.endDate().isBefore(start))
                .map(contract -> new ContractSnapshot(contract.id(), contract.employeeId(), contract.baseSalary()))
                .toList();
        } catch (RuntimeException exception) {
            throw new ExternalServiceException("HR contract service is unavailable", exception);
        }
    }

    private record HrContractResponse(
        String id, String employeeId, Instant startDate, Instant endDate,
        BigDecimal baseSalary, String status
    ) {}

    public record ContractSnapshot(String id, String employeeId, BigDecimal baseSalary) {}
}
