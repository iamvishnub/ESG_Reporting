
package com.esg.esgreporting.controller;

import com.esg.esgreporting.entity.Metric;
import com.esg.esgreporting.repository.MetricRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/metrics")
public class MetricController {

    private final MetricRepository repository;

    private static final Set<String> VALID_PILLARS =
            Set.of("Environmental", "Social", "Governance");

    private static final Set<String> VALID_DATA_STATUSES =
            Set.of("Measured", "Estimated", "Unavailable", "N/A");

    public MetricController(MetricRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Metric> getAllMetrics() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Metric getMetricById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Metric not found"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Metric createMetric(@RequestBody Metric metric) {
        validateMetric(metric);

        if (metric.getStatus() == null || metric.getStatus().isBlank()) {
            metric.setStatus("Provided");
        }
        if (metric.getReviewStatus() == null
        || metric.getReviewStatus().isBlank()) {
    metric.setReviewStatus("Draft");
}
        return repository.save(metric);
    }

    @PutMapping("/{id}")
    public Metric updateMetric(
            @PathVariable Long id,
            @RequestBody Metric updatedMetric) {

        Metric existing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Metric not found"));

        validateMetric(updatedMetric);

        existing.setName(updatedMetric.getName().trim());
        existing.setPillar(updatedMetric.getPillar());
        existing.setUnit(updatedMetric.getUnit().trim());
        existing.setValue(updatedMetric.getValue());
        existing.setReportingPeriod(updatedMetric.getReportingPeriod());
        existing.setDataStatus(updatedMetric.getDataStatus());
        existing.setSource(updatedMetric.getSource());
        existing.setMethod(updatedMetric.getMethod());
        existing.setAssumptions(updatedMetric.getAssumptions());
        existing.setOwner(updatedMetric.getOwner());

        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMetric(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Metric not found");
        }

        repository.deleteById(id);
    }

    private void validateMetric(Metric metric) {
        if (metric.getName() == null || metric.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Metric name is required");
        }

        if (metric.getPillar() == null
                || !VALID_PILLARS.contains(metric.getPillar())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid ESG pillar");
        }

        if (metric.getUnit() == null || metric.getUnit().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Metric unit is required");
        }

        if (metric.getValue() != null
                && (!Double.isFinite(metric.getValue())
                || metric.getValue() < 0)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Metric value must be finite and non-negative");
        }

        if (metric.getDataStatus() != null
                && !VALID_DATA_STATUSES.contains(metric.getDataStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Data status must be Measured, Estimated, Unavailable, or N/A");
        }

        if ("Unavailable".equals(metric.getDataStatus())
                || "N/A".equals(metric.getDataStatus())) {
            if (metric.getAssumptions() == null
                    || metric.getAssumptions().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Provide a reason for Unavailable or N/A data");
            }
        }
        
    }
    

@PutMapping("/{id}/edit")
public Metric editMetric(
        @PathVariable Long id,
        @RequestBody Metric updatedMetric) {

    Metric existing = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND, "Metric not found"));

    String currentStatus = existing.getReviewStatus();

    if (!"Draft".equals(currentStatus)
            && !"Changes Requested".equals(currentStatus)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Only Draft or Changes Requested metrics can be edited");
    }

    validateMetric(updatedMetric);

    existing.setName(updatedMetric.getName().trim());
    existing.setPillar(updatedMetric.getPillar());
    existing.setUnit(updatedMetric.getUnit().trim());
    existing.setValue(updatedMetric.getValue());
    existing.setReportingPeriod(updatedMetric.getReportingPeriod());
    existing.setDataStatus(updatedMetric.getDataStatus());
    existing.setSource(updatedMetric.getSource());
    existing.setMethod(updatedMetric.getMethod());
    existing.setAssumptions(updatedMetric.getAssumptions());
    existing.setOwner(updatedMetric.getOwner());

    return repository.save(existing);
}
}