package com.sentinel.security.service;

import com.sentinel.security.model.Asset;
import com.sentinel.security.model.PerformanceMetric;
import com.sentinel.security.repo.AssetRepository;
import com.sentinel.security.repo.IncidentRepository;
import com.sentinel.security.repo.PerformanceMetricRepository;
import com.sentinel.security.repo.VulnerabilityRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatOpsToolService {

    private final AssetRepository assetRepository;
    private final IncidentRepository incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final PerformanceMetricRepository metricRepository;

    public ChatOpsToolService(AssetRepository assetRepository,
                              IncidentRepository incidentRepository,
                              VulnerabilityRepository vulnerabilityRepository,
                              PerformanceMetricRepository metricRepository) {
        this.assetRepository = assetRepository;
        this.incidentRepository = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.metricRepository = metricRepository;
    }

    public String getCriticalAssetsCount() {
        long count = assetRepository.findAll().stream()
                .filter(a -> a.getStatus() == Asset.HealthStatus.CRITICAL)
                .count();
        return "There are currently " + count + " critical assets registered in the system.";
    }

    public String getCloudAssetsSummary(String provider) {
        List<Asset> assets = assetRepository.findAll();
        if (provider != null && !provider.isBlank()) {
            String query = provider.toLowerCase().trim();
            List<Asset> filtered = assets.stream()
                    .filter(a -> (a.getType() != null && a.getType().name().toLowerCase().contains(query)) ||
                            (a.getName() != null && a.getName().toLowerCase().contains(query)) ||
                            (a.getIp() != null && a.getIp().contains(query)))
                    .collect(Collectors.toList());

            if (filtered.isEmpty()) {
                return "No assets found matching '" + provider + "'. Available types: SERVER, CLOUD_AWS, CLOUD_AZURE, K8S_POD.";
            }

            String names = filtered.stream()
                    .map(a -> a.getName() + " (" + a.getType() + ")")
                    .limit(5)
                    .collect(Collectors.joining(", "));

            return "Found " + filtered.size() + " assets matching '" + provider + "'. Examples: " + names;
        }
        return "Total registered assets: " + assets.size();
    }

    // NEW METHOD: Scans the user's prompt for any known asset name
    public String getTelemetryFromPrompt(String prompt) {
        String lowerPrompt = prompt.toLowerCase();

        // 1. Try to find an exact asset name match anywhere in the sentence
        for (Asset asset : assetRepository.findAll()) {
            if (asset.getName() != null && lowerPrompt.contains(asset.getName().toLowerCase())) {
                return getAssetTelemetry(asset.getName());
            }
        }

        // 2. Fallback to the old "last word" logic if no explicit match is found
        String[] tokens = prompt.split(" ");
        String target = tokens[tokens.length - 1].replaceAll("[^a-zA-Z0-9_-]", "");
        return getAssetTelemetry(target.isEmpty() ? "SRV-PROD-01" : target);
    }

    public String getAssetTelemetry(String assetNameOrId) {
        Optional<Asset> assetOpt = assetRepository.findAll().stream()
                .filter(a -> a.getName().equalsIgnoreCase(assetNameOrId) ||
                        String.valueOf(a.getAssetId()).equalsIgnoreCase(assetNameOrId) ||
                        (a.getIp() != null && a.getIp().equalsIgnoreCase(assetNameOrId)))
                .findFirst();

        if (assetOpt.isEmpty()) {
            return "Asset '" + assetNameOrId + "' could not be found. Please check the asset name, IP, or UUID in the Assets page.";
        }

        Asset asset = assetOpt.get();
        Optional<PerformanceMetric> metric = metricRepository.findByAssetId(asset.getAssetId());

        if (metric.isPresent()) {
            PerformanceMetric pm = metric.get();
            return String.format("Asset '%s' [IP: %s | Type: %s | Status: %s]: CPU Usage is at %.2f%%, Memory Usage is at %.2f%%, Disk Usage is at %.2f%%.",
                    asset.getName(), asset.getIp(), asset.getType(), asset.getStatus(), pm.getCpuUsage(), pm.getMemoryUsage(), pm.getDiskUsage());
        }

        return String.format("Asset '%s' [IP: %s | Type: %s] is currently '%s', but no performance telemetry record was found.",
                asset.getName(), asset.getIp(), asset.getType(), asset.getStatus());
    }

    public String getIncidentSummary() {
        long openCount = incidentRepository.count();
        return "There are currently " + openCount + " tracked security incidents in SentinelCore.";
    }

    public String getVulnerabilitySummary() {
        long count = vulnerabilityRepository.count();
        return "There are currently " + count + " vulnerabilities tracked across all assets.";
    }
}