package com.sentinel.security.controller;

import com.sentinel.security.dto.ActivityHeatmapDTO;
import com.sentinel.security.dto.ComplianceSummaryDTO;
import com.sentinel.security.model.AuditLog;
import com.sentinel.security.service.AuditComplianceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuditComplianceController {

    private final AuditComplianceService auditComplianceService;

    public AuditComplianceController(AuditComplianceService auditComplianceService) {
        this.auditComplianceService = auditComplianceService;
    }

    @GetMapping("/audit/logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditComplianceService.getAllAuditLogs());
    }

    @GetMapping("/compliance/summary")
    public ResponseEntity<ComplianceSummaryDTO> getComplianceSummary() {
        return ResponseEntity.ok(auditComplianceService.getComplianceSummary());
    }

    @PostMapping("/audit/log")
    public ResponseEntity<AuditLog> createAuditLog(
            @RequestParam String email,
            @RequestParam String action,
            @RequestParam String resource,
            @RequestParam(defaultValue = "N/A") String targetId,
            @RequestParam(defaultValue = "System Target") String targetName,
            @RequestParam String status,
            @RequestParam(defaultValue = "127.0.0.1") String ip) {
        return ResponseEntity.ok(auditComplianceService.logAction(email, action, resource, targetId, targetName, status, ip));
    }

    @GetMapping("/dashboard/activity-heatmap")
    public ResponseEntity<ActivityHeatmapDTO> getActivityHeatmap(
            Authentication authentication,
            @RequestParam(defaultValue = "365") int days) {
        String userEmail = (authentication != null && authentication.getName() != null)
                ? authentication.getName()
                : "admin@sentinel.com";
        return ResponseEntity.ok(auditComplianceService.getUserActivityHeatmap(userEmail, days));
    }
}