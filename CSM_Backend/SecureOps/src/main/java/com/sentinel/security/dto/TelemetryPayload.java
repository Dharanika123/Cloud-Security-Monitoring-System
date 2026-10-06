package com.sentinel.security.dto;

import java.util.UUID;

public class TelemetryPayload {
    private UUID assetId;
    private float cpuUsage;
    private float memoryUsage;
    private float diskUsage;
    private float networkUsage;
    
    // Alert Fields
    private String alertType;
    private String alertDescription;

    public UUID getAssetId() { return assetId; }
    public void setAssetId(UUID assetId) { this.assetId = assetId; }

    public float getCpuUsage() { return cpuUsage; }
    public void setCpuUsage(float cpuUsage) { this.cpuUsage = cpuUsage; }

    public float getMemoryUsage() { return memoryUsage; }
    public void setMemoryUsage(float memoryUsage) { this.memoryUsage = memoryUsage; }

    public float getDiskUsage() { return diskUsage; }
    public void setDiskUsage(float diskUsage) { this.diskUsage = diskUsage; }

    public float getNetworkUsage() { return networkUsage; }
    public void setNetworkUsage(float networkUsage) { this.networkUsage = networkUsage; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public String getAlertDescription() { return alertDescription; }
    public void setAlertDescription(String alertDescription) { this.alertDescription = alertDescription; }
}
