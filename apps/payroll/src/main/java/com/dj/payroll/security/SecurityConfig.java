package com.dj.payroll.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final String jwtSecret;

    public SecurityConfig(
        @Value("${spring.security.oauth2.resourceserver.jwt.secret-key}") String jwtSecret) {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 characters");
        }
        this.jwtSecret = jwtSecret;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/api/payroll/payruns",
                    "/api/payroll/payruns/*",
                    "/api/payroll/payruns/*/payslips",
                    "/api/payroll/payruns/*/audit",
                    "/api/payroll/payruns/*/payment-status",
                    "/api/payroll/payslips/*",
                    "/api/payroll/payslips/*/pdf",
                    "/api/payroll/payslips/*/payment-status",
                    "/api/payroll/reports/**",
                    "/api/payroll/salary-rules",
                    "/api/payroll/salary-rules/*",
                    "/api/payroll/salary-structures",
                    "/api/payroll/salary-structures/*",
                    "/api/payroll/salary-rule-categories",
                    "/api/payroll/salary-rule-categories/*")
                    .hasAnyRole("ADMIN", "PAYROLL_MANAGER", "HR_MANAGER")
                .requestMatchers(
                    "/api/payroll/payruns",
                    "/api/payroll/payruns/*/compute",
                    "/api/payroll/payruns/*/validate",
                    "/api/payroll/payruns/*/pay",
                    "/api/payroll/payruns/*/cancel",
                    "/api/payroll/salary-rules/**",
                    "/api/payroll/salary-structures/**",
                    "/api/payroll/salary-rule-categories/**")
                    .hasAnyRole("ADMIN", "PAYROLL_MANAGER")
                .requestMatchers("/api/payroll/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));

        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder() {
        var key = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        return NimbusJwtDecoder.withSecretKey(key).build();
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Object roleClaim = jwt.getClaims().get("role");
            if (roleClaim instanceof String role) {
                return List.<GrantedAuthority>of(new SimpleGrantedAuthority("ROLE_" + role));
            }
            if (roleClaim instanceof Collection<?> roles) {
                return roles.stream()
                    .map(Object::toString)
                    .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
                    .toList();
            }
            return List.<GrantedAuthority>of();
        });
        return converter;
    }
}
