
package com.esg.esgreporting.repository;

import com.esg.esgreporting.entity.Metric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MetricRepository extends JpaRepository<Metric, Long> {

    List<Metric> findByReviewStatus(String reviewStatus);
}
