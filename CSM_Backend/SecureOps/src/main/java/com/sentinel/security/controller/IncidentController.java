package com.sentinel.security.controller;

import com.sentinel.security.model.Incident;
import com.sentinel.security.repo.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "http://localhost:5173")
public class IncidentController {

    @Autowired
    private IncidentRepository incidentRepository;

    @GetMapping
    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    @PostMapping
    public Incident createIncident(@RequestBody Incident incident) {
        if (incident.getIncidentTicket() == null) {
            incident.setIncidentTicket("INC-2026-" + (1000 + (int)(Math.random() * 9000)));
        }
        return incidentRepository.save(incident);
    }

    @GetMapping({"/critical", "/cirital"})
    public List<Incident> getAllCriticalIncidents(){
        return incidentRepository.findBySeverityAndStatusNot(Incident.IncidentSeverity.CRITICAL, Incident.IncidentStatus.RESOLVED);
    }

    // Endpoint to update state transition workflows via UI command choices
    @PutMapping("/{id}/status")
    public ResponseEntity<Incident> updateIncidentStatus(
            @PathVariable UUID id,
            @RequestParam Incident.IncidentStatus status) {

        return incidentRepository.findById(id)
                .map(incident -> {
                    incident.setStatus(status);
                    if (status == Incident.IncidentStatus.RESOLVED) {
                        incident.setEtaMinutes(0);
                    }
                    Incident updated = incidentRepository.save(incident);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getIncidentStats() {
        List<Incident> allIncidents = incidentRepository.findAll();

        long activeCount = allIncidents.stream()
                .filter(i -> i.getStatus() != Incident.IncidentStatus.RESOLVED)
                .count();

        long resolvedCount = allIncidents.stream()
                .filter(i -> i.getStatus() == Incident.IncidentStatus.RESOLVED)
                .count();

        int mttrMinutes = resolvedCount > 0 ? 30 : 0;

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("activeIncidents", activeCount);
        stats.put("resolvedIncidents", resolvedCount);
        stats.put("mttr", mttrMinutes);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncidentById(@PathVariable("id") UUID incidentId){
        return incidentRepository.findById(incidentId)
                .map(ResponseEntity :: ok)
                .orElse(ResponseEntity.notFound().build());
    }
}