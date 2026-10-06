package com.sentinel.security.service;

import com.sentinel.security.dto.TelemetryPayload;
import com.sentinel.security.model.Alert;
import com.sentinel.security.model.Asset;
import com.sentinel.security.model.Incident;
import com.sentinel.security.model.PerformanceMetric;
import com.sentinel.security.repo.AlertRepository;
import com.sentinel.security.repo.AssetRepository;
import com.sentinel.security.repo.PerformanceMetricRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class InfrastructureMonitoringService {

    private final AssetRepository assetRepository;
    private final PerformanceMetricRepository metricRepository;
    private final AlertRepository alertRepository;
    private final IncidentService incidentService;

    public InfrastructureMonitoringService(AssetRepository assetRepository,
                                           PerformanceMetricRepository metricRepository,
                                           AlertRepository alertRepository,
                                           IncidentService incidentService) {
        this.assetRepository = assetRepository;
        this.metricRepository = metricRepository;
        this.alertRepository = alertRepository;
        this.incidentService = incidentService;
    }

    // Process real telemetry data from agents
    @Transactional
    public void processAgentTelemetry(TelemetryPayload payload) {
        if (payload.getAssetId() == null) return;

        Optional<Asset> assetOpt = assetRepository.findById(payload.getAssetId());
        if (assetOpt.isEmpty()) {
            return; // Asset doesn't exist, ignore
        }

        Asset asset = assetOpt.get();
        // Update asset last seen timestamp
        asset.setLastSeen(OffsetDateTime.now());

        // If it was offline, mark it as Healthy pending metric evaluation
        if (asset.getStatus() == Asset.HealthStatus.OFFLINE) {
            asset.setStatus(Asset.HealthStatus.HEALTHY);
        }

        assetRepository.save(asset);

        // Check if payload contains an alert
        if (payload.getAlertType() != null && !payload.getAlertType().isEmpty()) {
            // Handle explicit agent alert (e.g., USB_DETECTED, SOFTWARE_INSTALLED)
            handleAgentAlert(asset, payload.getAlertType(), payload.getAlertDescription());
        } else {
            // Handle regular metrics
            Optional<PerformanceMetric> existingMetric = metricRepository.findByAssetId(asset.getAssetId());
            PerformanceMetric metric;

            if (existingMetric.isPresent()) {
                metric = existingMetric.get();
                metric.setCpuUsage(payload.getCpuUsage());
                metric.setMemoryUsage(payload.getMemoryUsage());
                metric.setDiskUsage(payload.getDiskUsage());
                metric.setNetworkUsage(payload.getNetworkUsage());
                metric.setTimestamp(OffsetDateTime.now());
            } else {
                metric = new PerformanceMetric(
                        asset.getAssetId(),
                        payload.getCpuUsage(),
                        payload.getMemoryUsage(),
                        payload.getDiskUsage(),
                        payload.getNetworkUsage());
            }

            metricRepository.save(metric);
            evaluateRulesAndHealth(asset, metric);
        }
    }

    private void handleAgentAlert(Asset asset, String alertType, String description) {
        // Find if this specific alert combination already exists today to avoid spamming
        // For simplicity, we just trigger it and rely on limit maintenance

        Alert.AlertSeverity severity = Alert.AlertSeverity.HIGH;
        if ("USB_DETECTED".equals(alertType)) {
            severity = Alert.AlertSeverity.CRITICAL; // High risk in enterprise
        }

        String solution = "Investigate " + alertType + ": " + description;

        Alert alert = new Alert(
            asset.getAssetId(),
            alertType,
            0.0f, // No specific violation value for categorical alerts
            asset.getName(),
            severity,
            solution
        );

        alertRepository.save(alert);
        maintainAlertLimit();

        // Possibly elevate asset status and create incident
        if (severity == Alert.AlertSeverity.CRITICAL && asset.getStatus() != Asset.HealthStatus.CRITICAL) {
            asset.setStatus(Asset.HealthStatus.CRITICAL);
            asset.setUpdatedAt(OffsetDateTime.now());
            assetRepository.save(asset);
        }
    }

    // Checking if monitored agent assets are offline (not seen for > 120 seconds)
    @Scheduled(fixedRate = 15000)
    @Transactional
    public void checkAssetOfflineStatus() {
        List<Asset> assets = assetRepository.findAll();
        OffsetDateTime thresholdTime = OffsetDateTime.now().minusSeconds(120);

        for (Asset asset : assets) {
            // Only transition to OFFLINE if the asset is actively monitored by an agent
            boolean hasTelemetry = metricRepository.findByAssetId(asset.getAssetId()).isPresent();
            if (hasTelemetry && asset.getLastSeen() != null && asset.getLastSeen().isBefore(thresholdTime)) {
                if (asset.getStatus() != Asset.HealthStatus.OFFLINE) {
                    asset.setStatus(Asset.HealthStatus.OFFLINE);
                    asset.setUpdatedAt(OffsetDateTime.now());
                    assetRepository.save(asset);
                    System.out.println("Asset marked offline due to telemetry inactivity: " + asset.getName());
                }
            }
        }
    }

    private void evaluateRulesAndHealth(Asset asset, PerformanceMetric metric) {
        Asset.HealthStatus targetStatus = Asset.HealthStatus.HEALTHY;

        targetStatus = checkMetricThreshold(asset, "CPU", metric.getCpuUsage(), targetStatus);
        targetStatus = checkMetricThreshold(asset, "Memory", metric.getMemoryUsage(), targetStatus);
        targetStatus = checkMetricThreshold(asset, "Disk", metric.getDiskUsage(), targetStatus);

        if (asset.getStatus() != targetStatus) {
            asset.setStatus(targetStatus);
            asset.setUpdatedAt(OffsetDateTime.now());
            assetRepository.save(asset);

            if (targetStatus == Asset.HealthStatus.CRITICAL) {
                incidentService.triggerIncidentFromFailure(asset, metric);
            }
        }
    }

    private Asset.HealthStatus checkMetricThreshold(Asset asset, String metricName, float value, Asset.HealthStatus currentEvaluatedStatus) {
        Asset.HealthStatus nextStatus = currentEvaluatedStatus;

        if (value >= 90.0f) {
            nextStatus = Asset.HealthStatus.CRITICAL;
            triggerAlertIfNew(asset, metricName, value, Alert.AlertSeverity.CRITICAL);
        } else if (value >= 75.0f) {
            if (nextStatus != Asset.HealthStatus.CRITICAL) {
                nextStatus = Asset.HealthStatus.WARNING;
            }
            triggerAlertIfNew(asset, metricName, value, Alert.AlertSeverity.HIGH);
        } else {
            resolveAlertsIfAny(asset.getAssetId(), metricName);
        }

        return nextStatus;
    }

    private void triggerAlertIfNew(Asset asset, String metricName, float value, Alert.AlertSeverity severity) {
        List<Alert> activeAlerts = alertRepository.findByAssetId(asset.getAssetId());
        boolean alreadyFired = activeAlerts.stream().anyMatch(a -> a.getMetricName().equalsIgnoreCase(metricName));

        if (!alreadyFired) {
            maintainAlertLimit();

            String solution = "";
            if (metricName.equals("CPU")) {
                solution = "Auto Scaling";
            } else if (metricName.equals("Memory")) {
                solution = "Stop unnecessary processes";
            } else {
                solution = "Clean Up";
            }

            Alert alert = new Alert(asset.getAssetId(), metricName, value, asset.getName(), severity, solution);
            alertRepository.save(alert);
        }
    }

    @Transactional
    public void resolveAlertsIfAny(UUID assetId, String metricName) {
        List<Alert> activeAlerts = alertRepository.findByAssetId(assetId);
        activeAlerts.stream()
                .filter(a -> a.getMetricName().equalsIgnoreCase(metricName))
                .forEach(alertRepository::delete);
    }

    private void maintainAlertLimit() {
        long totalAlerts = alertRepository.count();
        if (totalAlerts >= 70) {
            List<Alert> alerts = alertRepository.findAllByOrderByCreatedAtAsc();
            if (!alerts.isEmpty()) {
                alertRepository.delete(alerts.get(0));
            }
        }
    }
}
