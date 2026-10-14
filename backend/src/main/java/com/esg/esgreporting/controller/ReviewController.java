
package com.esg.esgreporting.controller;

import com.esg.esgreporting.entity.AuditLog;
import com.esg.esgreporting.entity.Metric;
import com.esg.esgreporting.repository.AuditLogRepository;
import com.esg.esgreporting.repository.MetricRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/metrics")
public class ReviewController {

    private final MetricRepository metricRepository;
    private final AuditLogRepository auditLogRepository;

    private static final Set<String> VALID_STATUSES = Set.of(
        "Draft",
        "Submitted",
        "Changes Requested",
        "Approved"
    );

    public ReviewController(
            MetricRepository metricRepository,
            AuditLogRepository auditLogRepository) {
        this.metricRepository = metricRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @PatchMapping("/{id}/review")
    public Metric updateReviewStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        Metric metric = metricRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Metric not found"));

        String newStatus = request.get("reviewStatus");
        String oldStatus = metric.getReviewStatus();

        if (newStatus == null || !VALID_STATUSES.contains(newStatus)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid review status");
        }

        boolean allowed =
            ("Draft".equals(oldStatus) && "Submitted".equals(newStatus))
            || ("Submitted".equals(oldStatus)
                && ("Changes Requested".equals(newStatus)
                    || "Approved".equals(newStatus)))
            || ("Changes Requested".equals(oldStatus)
                && "Submitted".equals(newStatus));

        if (!allowed) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid transition from " + oldStatus + " to " + newStatus);
        }

        metric.setReviewStatus(newStatus);
        Metric savedMetric = metricRepository.save(metric);

        AuditLog log = new AuditLog();
        log.setMetricId(id);
        log.setAction("REVIEW_STATUS_CHANGED");
        log.setPreviousStatus(oldStatus);
        log.setNewStatus(newStatus);
        log.setChangedBy("local-demo-user");

        auditLogRepository.save(log);

        return savedMetric;
    }

    @GetMapping("/{id}/audit")
    public List<AuditLog> getAuditHistory(@PathVariable Long id) {
        if (!metricRepository.existsById(id)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Metric not found");
        }

        return auditLogRepository
            .findByMetricIdOrderByChangedAtDesc(id);
    }
}
