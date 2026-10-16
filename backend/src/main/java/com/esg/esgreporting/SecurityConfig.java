
package com.esg.esgreporting;

import java.util.List;

import jakarta.servlet.DispatcherType;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(
    "http://localhost:5173",
    "https://esg-reporting-nmju.onrender.com"
));

                config.setAllowedMethods(List.of(
                    "GET",
                    "POST",
                    "PUT",
                    "PATCH",
                    "DELETE",
                    "OPTIONS"
                ));

                config.setAllowedHeaders(List.of("*"));

                return config;
            }))

            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(Customizer.withDefaults())

            .authorizeHttpRequests(auth -> auth

                .dispatcherTypeMatchers(
                    DispatcherType.ERROR
                ).permitAll()

                .requestMatchers(
                    "/error",
                    "/api/health"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/metrics/*/audit"
                ).hasAnyRole("ADMIN", "REVIEWER")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/metrics/**"
                ).hasAnyRole(
                    "ADMIN",
                    "CONTRIBUTOR",
                    "REVIEWER",
                    "REPORT_VIEWER"
                )

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/metrics/**"
                ).hasAnyRole("ADMIN", "CONTRIBUTOR")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/metrics/**"
                ).hasAnyRole("ADMIN", "CONTRIBUTOR")

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/metrics/**"
                ).hasAnyRole("ADMIN", "REVIEWER")

                .requestMatchers(
                    "/api/reports/**"
                ).hasAnyRole(
                    "ADMIN",
                    "REVIEWER",
                    "REPORT_VIEWER"
                )

                .requestMatchers(
                    "/api/calculations/**"
                ).hasAnyRole(
                    "ADMIN",
                    "CONTRIBUTOR",
                    "REVIEWER"
                )

                .anyRequest().authenticated()
            );

        return http.build();
    }
}
