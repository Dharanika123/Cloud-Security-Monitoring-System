package com.sentinel.security.service;

import com.sentinel.security.dto.*;
import com.sentinel.security.model.*;
import com.sentinel.security.repo.*;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final AssetRepository assetRepository;
    private final PerformanceMetricRepository metricRepository;
    private final AlertRepository alertRepository;
    private final IncidentRepository incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditComplianceService auditComplianceService;

    public DashboardService(AssetRepository assetRepository,
                            PerformanceMetricRepository metricRepository,
                            AlertRepository alertRepository,
                            IncidentRepository incidentRepository,
                            VulnerabilityRepository vulnerabilityRepository,
                            AuditLogRepository auditLogRepository,
                            AuditComplianceService auditComplianceService) {
        this.assetRepository = assetRepository;
        this.metricRepository = metricRepository;
        this.alertRepository = alertRepository;
        this.incidentRepository = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditComplianceService = auditComplianceService;
    }

    public DashboardOverviewDTO getOverview() {
        long totalAssets = assetRepository.count();
        long activeAlerts = alertRepository.count();
        long activeIncidents = incidentRepository.countByStatusNot(Incident.IncidentStatus.RESOLVED);
        long resolvedIncidents = incidentRepository.countByStatus(Incident.IncidentStatus.RESOLVED);

        double uptimePercentage = totalAssets > 0
                ? Math.round(((double) (totalAssets - assetRepository.countByStatus(Asset.HealthStatus.CRITICAL) - assetRepository.countByStatus(Asset.HealthStatus.OFFLINE)) / totalAssets) * 10000.0) / 100.0
                : 100.0;
        if (uptimePercentage < 0) uptimePercentage = 0.0;

        return new DashboardOverviewDTO(
                totalAssets,
                uptimePercentage,
                activeAlerts,
                activeIncidents,
                resolvedIncidents,
                resolvedIncidents > 0 ? 30 : 0
        );
    }

    public SystemHealthDTO getSystemHealth() {
        long healthy = assetRepository.countByStatus(Asset.HealthStatus.HEALTHY);
        long warning = assetRepository.countByStatus(Asset.HealthStatus.WARNING);
        long critical = assetRepository.countByStatus(Asset.HealthStatus.CRITICAL);

        return new SystemHealthDTO(healthy, warning, critical);
    }

    public List<AuditSummaryDTO> getAuditLogsSummary(){
        List<AuditLog> auditLogs = auditLogRepository.findTop5ByOrderByTimestampDesc();

        return auditLogs.stream().map(auditLog -> {
            AuditSummaryDTO dto = new AuditSummaryDTO(auditLog.getUserEmail(), auditLog.getTimestamp(), auditLog.getAction());
            return dto;
        }).collect(Collectors.toList());
    }

    public List<AlertResponseDTO> getRecentAlerts() {
        List<Alert> alerts = alertRepository.findTop5ByOrderByCreatedAtDesc();

        return alerts.stream().map(alert -> {
            Asset asset = assetRepository.findById(alert.getAssetId()).orElse(null);
            String assetName = asset != null ? asset.getName() : (alert.getServerName() != null ? alert.getServerName() : "UNKNOWN");

            AlertResponseDTO dto = new AlertResponseDTO(
                    alert.getAlertId(),
                    alert.getAssetId(),
                    assetName,
                    alert.getMetricName(),
                    alert.getViolationValue(),
                    alert.getSeverity().toString(),
                    alert.getSolution() != null ? alert.getSolution() : "Investigating"
            );
            if (alert.getServerName() != null) {
                dto.setServerName(alert.getServerName());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    public List<Incident> getRecentIncidents() {
        return incidentRepository.findTop5ByOrderByCreatedAtDesc();
    }

    public ResourceSummaryDTO getResourceSummary() {
        ResourceSummaryDTO summary = metricRepository.findAverageResourceMetrics();
        if (summary == null || summary.getCpuUsage() == null) {
            return new ResourceSummaryDTO(0.0, 0.0, 0.0, 0.0);
        }
        return summary;
    }

    public List<MonitoringChartDTO> getMonitoringHistory(UUID assetId) {
        List<PerformanceMetric> metrics;
        if (assetId != null) {
            metrics = metricRepository.findTop10ByAssetIdOrderByTimestampDesc(assetId);
        } else {
            metrics = metricRepository.findTop20ByOrderByTimestampDesc();
        }

        return metrics.stream()
                .map(m -> new MonitoringChartDTO(m.getTimestamp(), m.getCpuUsage(), m.getMemoryUsage(), m.getDiskUsage(), m.getNetworkUsage()))
                .collect(Collectors.toList());
    }

    public SocDashboardDTO getSocDashboardData() {
        long totalAssets = assetRepository.count();
        long healthyAssets = assetRepository.countByStatus(Asset.HealthStatus.HEALTHY);
        long warningAssets = assetRepository.countByStatus(Asset.HealthStatus.WARNING);
        long criticalAssets = assetRepository.countByStatus(Asset.HealthStatus.CRITICAL);
        long offlineAssets = assetRepository.countByStatus(Asset.HealthStatus.OFFLINE);

        long serverAssets = assetRepository.countByType(Asset.AssetType.SERVER);
        long awsAssets = assetRepository.countByType(Asset.AssetType.CLOUD_AWS);
        long azureAssets = assetRepository.countByType(Asset.AssetType.CLOUD_AZURE);
        long k8sAssets = assetRepository.countByType(Asset.AssetType.K8S_POD);

        long activeAlerts = alertRepository.count();

        List<Incident> allIncidents = incidentRepository.findAll();
        long openIncidents = allIncidents.stream()
                .filter(i -> i.getStatus() != Incident.IncidentStatus.RESOLVED).count();
        long resolvedIncidents = allIncidents.stream()
                .filter(i -> i.getStatus() == Incident.IncidentStatus.RESOLVED).count();

        List<Vulnerability> vulns = vulnerabilityRepository.findAll();
        long criticalVulns = vulns.stream()
                .filter(v -> v.getSeverity() == Vulnerability.VulnSeverity.CRITICAL && v.getPatchStatus() != Vulnerability.PatchStatus.PATCHED).count();

        // Incident distribution
        Map<String, Long> incBySev = allIncidents.stream()
                .collect(Collectors.groupingBy(i -> i.getSeverity().name(), Collectors.counting()));

        // Vulnerability distribution
        Map<String, Long> vulBySev = vulns.stream()
                .collect(Collectors.groupingBy(v -> v.getSeverity().name(), Collectors.counting()));

        // Patch progress
        int totalAffected = vulns.stream().mapToInt(Vulnerability::getAffectedServersCount).sum();
        int totalPatched = vulns.stream().mapToInt(Vulnerability::getPatchedServersCount).sum();
        double patchProgress = totalAffected > 0 ? Math.round(((double) totalPatched / totalAffected) * 1000.0) / 10.0 : 0.0;

        // Top 5 Critical CVEs
        List<Vulnerability> topCVEs = vulns.stream()
                .filter(v -> v.getSeverity() == Vulnerability.VulnSeverity.CRITICAL)
                .sorted((a, b) -> Float.compare(b.getCvssScore(), a.getCvssScore()))
                .limit(5)
                .collect(Collectors.toList());

        // Top Critical Incident
        Incident topCriticalInc = allIncidents.stream()
                .filter(i -> i.getSeverity() == Incident.IncidentSeverity.CRITICAL && i.getStatus() != Incident.IncidentStatus.RESOLVED)
                .findFirst()
                .orElse(allIncidents.stream().filter(i -> i.getStatus() != Incident.IncidentStatus.RESOLVED).findFirst().orElse(null));

        // Calculated Scores directly from DB
        int secScore = (int) Math.max(0, 100 - (openIncidents * 5 + criticalVulns * 5 + criticalAssets * 10));
        String threatLevel = criticalVulns > 5 || openIncidents > 10 ? "CRITICAL" :
                criticalVulns > 2 || openIncidents > 5 ? "HIGH" :
                        openIncidents > 0 ? "MEDIUM" : "LOW";

        long auditLogsCount = auditLogRepository.count();

        double overallRiskScore = totalAssets > 0
                ? Math.min(100.0, Math.round(((double) (criticalAssets * 25 + openIncidents * 15 + criticalVulns * 10) / totalAssets) * 10.0) / 10.0)
                : 0.0;

        // Synchronize with AuditComplianceService so compliance percentage is 100% consistent across all pages
        ComplianceSummaryDTO compSummary = auditComplianceService.getComplianceSummary();
        double compliancePercentage = 100.0;
        try {
            compliancePercentage = Double.parseDouble(compSummary.getComplianceRate().replace("%", ""));
        } catch (Exception ignored) {}

        List<ComplianceCheck> complianceChecks = compSummary.getChecks();

        OffsetDateTime latestScan = vulns.stream()
                .map(Vulnerability::getLastScannedAt)
                .filter(java.util.Objects::nonNull)
                .max(OffsetDateTime::compareTo)
                .orElse(OffsetDateTime.now());

        return new SocDashboardDTO(
                totalAssets,
                healthyAssets,
                warningAssets,
                criticalAssets,
                offlineAssets,
                serverAssets,
                awsAssets,
                azureAssets,
                k8sAssets,
                activeAlerts,
                openIncidents,
                criticalVulns,
                overallRiskScore,
                compliancePercentage,
                auditLogsCount,
                latestScan,
                latestScan,
                getResourceSummary(),
                incBySev,
                openIncidents,
                resolvedIncidents,
                topCriticalInc,
                vulBySev,
                patchProgress,
                topCVEs,
                complianceChecks,
                auditLogRepository.findTop5ByOrderByTimestampDesc(),
                getRecentIncidents(),
                getRecentAlerts(),
                threatLevel,
                secScore,
                Map.of("Database", "HEALTHY", "API Gateway", "HEALTHY", "Redis", "HEALTHY", "Kafka", "HEALTHY")
        );
    }
}