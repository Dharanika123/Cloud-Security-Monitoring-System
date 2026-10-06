package com.sentinel.security.dto;

import java.util.List;
import com.sentinel.security.model.ComplianceCheck;

public class ComplianceSummaryDTO {
    private long totalAuditLogs;
    private String complianceRate;
    private int activeViolations;
    private String sonarQubeStatus;
    private String owaspStatus;
    private List<ComplianceCheck> checks;

    public ComplianceSummaryDTO(long totalAuditLogs, String complianceRate, int activeViolations, String sonarQubeStatus, String owaspStatus, List<ComplianceCheck> checks) {
        this.totalAuditLogs = totalAuditLogs;
        this.complianceRate = complianceRate;
        this.activeViolations = activeViolations;
        this.sonarQubeStatus = sonarQubeStatus;
        this.owaspStatus = owaspStatus;
        this.checks = checks;
    }

    public long getTotalAuditLogs() { return totalAuditLogs; }
    public String getComplianceRate() { return complianceRate; }
    public int getActiveViolations() { return activeViolations; }
    public String getSonarQubeStatus() { return sonarQubeStatus; }
    public String getOwaspStatus() { return owaspStatus; }
    public List<ComplianceCheck> getChecks() { return checks; }
}