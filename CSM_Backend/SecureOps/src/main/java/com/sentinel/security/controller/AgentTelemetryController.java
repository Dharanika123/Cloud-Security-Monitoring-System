package com.sentinel.security.controller;

import com.sentinel.security.dto.TelemetryPayload;
import com.sentinel.security.service.InfrastructureMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/telemetry")
public class AgentTelemetryController {

    private final InfrastructureMonitoringService monitoringService;

    public AgentTelemetryController(InfrastructureMonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @PostMapping
    public ResponseEntity<Void> receiveTelemetry(@RequestBody TelemetryPayload payload) {
        monitoringService.processAgentTelemetry(payload);
        return ResponseEntity.ok().build();
    }
}
