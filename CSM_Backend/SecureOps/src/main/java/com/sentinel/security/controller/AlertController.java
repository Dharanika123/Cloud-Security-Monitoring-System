package com.sentinel.security.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.sentinel.security.dto.AlertResponseDTO;
import com.sentinel.security.model.Alert;
import com.sentinel.security.model.Asset;
import com.sentinel.security.repo.AlertRepository;
import com.sentinel.security.repo.AssetRepository;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "http://localhost:5173")
public class AlertController {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AssetRepository assetRepository;

    @GetMapping
    public List<AlertResponseDTO> getAllAlerts() {
        List<Alert> alerts = alertRepository.findAll();
        
        return alerts.stream()
            .map(alert -> {
                // Fetch the asset to get its name
                Asset asset = assetRepository.findById(alert.getAssetId()).orElse(null);
                String assetName = asset != null ? asset.getName() : "UNKNOWN";
                
                // Create response DTO with all fields populated
                AlertResponseDTO dto = new AlertResponseDTO(
                    alert.getAlertId(),
                    alert.getAssetId(),
                    assetName,
                    alert.getMetricName(),
                    alert.getViolationValue(),
                    alert.getSeverity().toString(),
                    alert.getSolution() != null ? alert.getSolution() : "Investigating"
                );
                
                // Set the server name if available
                if (alert.getServerName() != null) {
                    dto.setServerName(alert.getServerName());
                }
                
                return dto;
            })
            .collect(Collectors.toList());
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAlertStatistics() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalAlerts", alertRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Alert> getAlertById(@PathVariable("id") UUID alertId){
        Alert alert=alertRepository.findById(alertId).orElse(null);
        if(alert==null){
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(alert);
    }
}