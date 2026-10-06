package com.sentinel.security.dto;

import com.sentinel.security.model.AuditLog;
import com.sentinel.security.model.ComplianceCheck;
import com.sentinel.security.model.Incident;
import com.sentinel.security.model.Vulnerability;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record SocDashboardDTO(
        // Status Counts (Matching Add Asset dropdown: HEALTHY, WARNING, CRITICAL, OFFLINE)
        long totalAssets,
        long healthyAssets,
        long warningAssets,
        long criticalAssets,
        long offlineAssets,

        // Type Counts (Matching Add Asset dropdown: SERVER, CLOUD_AWS, CLOUD_AZURE, K8S_POD)
        long serverAssets,
        long awsAssets,
        long azureAssets,
        long k8sAssets,

        // Security KPIs
        long activeAlerts,
        long activeIncidents,
        long criticalVulnerabilities,
        double overallRiskScore,
        double compliancePercentage,
        long auditLogsToday,
        OffsetDateTime lastTrivyScan,
        OffsetDateTime lastSonarScan,

        // Resource Usage
        ResourceSummaryDTO resourceSummary,

        // Security Operations
        Map<String, Long> incidentsBySeverity,
        long openIncidents,
        long resolvedIncidents,
        Incident topCriticalIncident,

        // Vulnerabilities
        Map<String, Long> vulnerabilitiesBySeverity,
        double patchProgressPercentage,
        List<Vulnerability> topCriticalCVEs,

        // Compliance
        List<ComplianceCheck> complianceSummary,

        // Timeline & Activity
        List<AuditLog> recentAuditLogs,
        List<Incident> recentIncidents,
        List<AlertResponseDTO> recentAlerts,

        // Metrics & Score
        String threatLevel, // LOW, MEDIUM, HIGH, CRITICAL
        int securityScore, // 0-100

        // Footer Infrastructure
        Map<String, String> systemServicesStatus
) {}