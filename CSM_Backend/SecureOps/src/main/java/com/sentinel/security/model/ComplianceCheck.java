package com.sentinel.security.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "compliance_checks")
public class ComplianceCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String framework;
    private String status;
    private int scorePercentage;
    private int totalControls;
    private int passedControls;
    private LocalDateTime lastScanned;

    public ComplianceCheck() {}

    public ComplianceCheck(String framework, String status, int scorePercentage, int totalControls, int passedControls) {
        this.framework = framework;
        this.status = status;
        this.scorePercentage = scorePercentage;
        this.totalControls = totalControls;
        this.passedControls = passedControls;
        this.lastScanned = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getFramework() { return framework; }
    public void setFramework(String framework) { this.framework = framework; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getScorePercentage() { return scorePercentage; }
    public void setScorePercentage(int scorePercentage) { this.scorePercentage = scorePercentage; }

    public int getTotalControls() { return totalControls; }
    public void setTotalControls(int totalControls) { this.totalControls = totalControls; }

    public int getPassedControls() { return passedControls; }
    public void setPassedControls(int passedControls) { this.passedControls = passedControls; }

    public LocalDateTime getLastScanned() { return lastScanned; }
    public void setLastScanned(LocalDateTime lastScanned) { this.lastScanned = lastScanned; }
}