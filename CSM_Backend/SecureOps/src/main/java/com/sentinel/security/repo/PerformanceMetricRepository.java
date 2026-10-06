package com.sentinel.security.repo;

import com.sentinel.security.dto.ResourceSummaryDTO;
import com.sentinel.security.model.PerformanceMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PerformanceMetricRepository extends JpaRepository<PerformanceMetric, UUID> {
    Optional<PerformanceMetric> findByAssetId(UUID assetId);

    // Fetch telemetry metrics ordered by timestamp descending for charts
    List<PerformanceMetric> findTop10ByAssetIdOrderByTimestampDesc(UUID assetId);
    List<PerformanceMetric> findTop20ByOrderByTimestampDesc();
    @Query("SELECT new com.sentinel.security.dto.ResourceSummaryDTO(" +
            "AVG(p.cpuUsage), AVG(p.memoryUsage), AVG(p.diskUsage), AVG(p.networkUsage)) " +
            "FROM PerformanceMetric p")
    ResourceSummaryDTO findAverageResourceMetrics();
}