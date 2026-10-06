package com.sentinel.security.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private String action;
    private String resource;
    private String affectedEntityId;
    private String affectedEntityName;
    private String status;
    private String ipAddress;
    private LocalDateTime timestamp;

    public AuditLog() {}

    public AuditLog(String userEmail, String action, String resource, String affectedEntityId, String affectedEntityName, String status, String ipAddress) {
        this.userEmail = userEmail;
        this.action = action;
        this.resource = resource;
        this.affectedEntityId = affectedEntityId;
        this.affectedEntityName = affectedEntityName;
        this.status = status;
        this.ipAddress = ipAddress;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public String getAffectedEntityId() { return affectedEntityId; }
    public void setAffectedEntityId(String affectedEntityId) { this.affectedEntityId = affectedEntityId; }

    public String getAffectedEntityName() { return affectedEntityName; }
    public void setAffectedEntityName(String affectedEntityName) { this.affectedEntityName = affectedEntityName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}