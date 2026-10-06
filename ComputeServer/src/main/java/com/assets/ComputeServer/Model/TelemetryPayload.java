package com.assets.ComputeServer.Model;

import lombok.Data;
import java.util.UUID;

@Data
public class TelemetryPayload {
    private UUID assetId;
    private float cpuUsage;
    private float memoryUsage;
    private float diskUsage;
    private float networkUsage;
    
    // Alert Fields
    private String alertType; // e.g., "USB_DETECTED", "SOFTWARE_INSTALLED"
    private String alertDescription;
}
