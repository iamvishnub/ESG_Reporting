
package com.esg.esgreporting.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.esg.esgreporting.entity.AuditLog;

import java.util.List;

public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByMetricIdOrderByChangedAtDesc(Long metricId);
}
