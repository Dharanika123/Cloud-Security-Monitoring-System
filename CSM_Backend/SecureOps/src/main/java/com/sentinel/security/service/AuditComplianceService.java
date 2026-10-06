package com.sentinel.security.service;

import com.sentinel.security.dto.ActivityHeatmapDTO;
import com.sentinel.security.dto.ComplianceSummaryDTO;
import com.sentinel.security.dto.DailyActivityDTO;
import com.sentinel.security.model.AuditLog;
import com.sentinel.security.model.ComplianceCheck;
import com.sentinel.security.repo.AuditLogRepository;
import com.sentinel.security.repo.ComplianceCheckRepository;
import com.sentinel.security.repo.IncidentRepository;
import com.sentinel.security.repo.VulnerabilityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuditComplianceService {

    private final AuditLogRepository auditLogRepository;
    private final ComplianceCheckRepository complianceCheckRepository;
    private final IncidentRepository incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;

    public AuditComplianceService(
            AuditLogRepository auditLogRepository,
            ComplianceCheckRepository complianceCheckRepository,
            IncidentRepository incidentRepository,
            VulnerabilityRepository vulnerabilityRepository) {
        this.auditLogRepository = auditLogRepository;
        this.complianceCheckRepository = complianceCheckRepository;
        this.incidentRepository = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
    }

    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public AuditLog logAction(String email, String action, String resource, String tId, String tName, String status, String ip) {
        return auditLogRepository.save(new AuditLog(email, action, resource, tId, tName, status, ip));
    }

    public ComplianceSummaryDTO getComplianceSummary() {
        long realAuditCount = auditLogRepository.count();

        long criticalIncidents = incidentRepository.findAll().stream()
                .filter(i -> "CRITICAL".equalsIgnoreCase(i.getSeverity().name()) && !"RESOLVED".equalsIgnoreCase(i.getStatus().name()))
                .count();

        long unpatchedCriticalVulns = vulnerabilityRepository.findAll().stream()
                .filter(v -> "CRITICAL".equalsIgnoreCase(v.getSeverity().name()) && !"PATCHED".equalsIgnoreCase(v.getPatchStatus().name()))
                .count();

        int activeViolations = (int) (criticalIncidents + unpatchedCriticalVulns);
        int complianceRate = activeViolations == 0 ? 100 : Math.max(50, 100 - (activeViolations * 10));

        updateComplianceCheck("PCI DSS", complianceRate, 240);
        updateComplianceCheck("SOC 2", complianceRate, 150);
        updateComplianceCheck("ISO 27001", complianceRate, 114);

        List<ComplianceCheck> checks = complianceCheckRepository.findAll();

        String sonarStatus = unpatchedCriticalVulns == 0 ? "0 Critical Vulnerabilities" : unpatchedCriticalVulns + " Critical Vulnerabilities";
        String owaspStatus = activeViolations == 0 ? "PASSED" : "FAILED_NEEDS_REMEDIATION";

        return new ComplianceSummaryDTO(realAuditCount, complianceRate + "%", activeViolations, sonarStatus, owaspStatus, checks);
    }

    private void updateComplianceCheck(String framework, int score, int totalControls) {
        int passed = (int) Math.round((score / 100.0) * totalControls);
        ComplianceCheck check = complianceCheckRepository.findByFramework(framework)
                .orElse(new ComplianceCheck(framework, score == 100 ? "COMPLIANT" : "NON_COMPLIANT", score, totalControls, passed));

        check.setScorePercentage(score);
        check.setStatus(score == 100 ? "COMPLIANT" : "NON_COMPLIANT");
        check.setPassedControls(passed);
        check.setLastScanned(LocalDateTime.now());

        complianceCheckRepository.save(check);
    }

    public ActivityHeatmapDTO getUserActivityHeatmap(String userEmail, int days) {
        LocalDate today = LocalDate.now();
        LocalDate rangeStart = today.minusDays(days - 1L);
        LocalDateTime queryStart = rangeStart.atStartOfDay();

        List<AuditLog> logs = auditLogRepository
                .findByUserEmailAndTimestampGreaterThanEqualOrderByTimestampAsc(userEmail, queryStart);

        // Group by calendar day
        Map<LocalDate, Long> countsByDay = logs.stream()
                .collect(Collectors.groupingBy(
                        l -> l.getTimestamp().toLocalDate(),
                        Collectors.counting()
                ));

        long maxCount = countsByDay.values().stream().max(Long::compare).orElse(0L);

        List<DailyActivityDTO> result = new ArrayList<>();
        for (LocalDate d = rangeStart; !d.isAfter(today); d = d.plusDays(1)) {
            long count = countsByDay.getOrDefault(d, 0L);
            result.add(new DailyActivityDTO(d.toString(), count, computeLevel(count)));
        }

        long totalCount = countsByDay.values().stream().mapToLong(Long::longValue).sum();

        // Trend: last 30 days vs the 30 days before that
        double trend = computeTrend(countsByDay, today);

        int streak = computeCurrentStreak(countsByDay, today);

        return new ActivityHeatmapDTO(result, maxCount, totalCount, trend, streak);
    }

    /**
     * Compute activity intensity levels based on fixed operational action thresholds.
     */
    private int computeLevel(long count) {
        if (count <= 0) return 0; // Level 0: 0 actions
        if (count < 3)  return 1; // Level 1: 1-2 actions
        if (count < 5)  return 2; // Level 2: 3-4 actions
        if (count < 10) return 3; // Level 3: 5-9 actions
        return 4;                 // Level 4: 10+ actions
    }

    private double computeTrend(Map<LocalDate, Long> countsByDay, LocalDate today) {
        long recent = 0, previous = 0;
        for (int i = 0; i < 30; i++) {
            recent += countsByDay.getOrDefault(today.minusDays(i), 0L);
        }
        for (int i = 30; i < 60; i++) {
            previous += countsByDay.getOrDefault(today.minusDays(i), 0L);
        }
        if (previous == 0) return recent > 0 ? 100.0 : 0.0;
        return Math.round(((double) (recent - previous) / previous) * 1000.0) / 10.0;
    }

    private int computeCurrentStreak(Map<LocalDate, Long> countsByDay, LocalDate today) {
        int streak = 0;
        LocalDate d = today;
        while (countsByDay.getOrDefault(d, 0L) > 0) {
            streak++;
            d = d.minusDays(1);
        }
        return streak;
    }
}