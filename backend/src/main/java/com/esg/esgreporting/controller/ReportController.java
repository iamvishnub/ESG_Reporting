
package com.esg.esgreporting.controller;

import com.esg.esgreporting.entity.Metric;
import com.esg.esgreporting.repository.MetricRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final MetricRepository repository;

    public ReportController(MetricRepository repository) {
        this.repository = repository;
    }

    
@GetMapping("/approved")
public List<Metric> getApprovedMetrics() {
    return repository.findByReviewStatus("Approved");
}

@GetMapping("/summary")
public java.util.Map<String, Object> getReportSummary() {
    List<Metric> approvedMetrics =
            repository.findByReviewStatus("Approved");

    java.util.Map<String, Object> summary =
            new java.util.LinkedHashMap<>();

    summary.put("totalApprovedMetrics", approvedMetrics.size());

    summary.put("environmentalCount",
            approvedMetrics.stream()
                    .filter(m -> "Environmental".equals(m.getPillar()))
                    .count());

    summary.put("socialCount",
            approvedMetrics.stream()
                    .filter(m -> "Social".equals(m.getPillar()))
                    .count());

    summary.put("governanceCount",
            approvedMetrics.stream()
                    .filter(m -> "Governance".equals(m.getPillar()))
                    .count());

    return summary;
}

@GetMapping("/pillar/{pillar}")
public List<Metric> getMetricsByPillar(
        @org.springframework.web.bind.annotation.PathVariable String pillar) {

    return repository.findByReviewStatus("Approved")
            .stream()
            .filter(metric -> metric.getPillar() != null
                    && metric.getPillar().equalsIgnoreCase(pillar))
            .toList();
}

}
