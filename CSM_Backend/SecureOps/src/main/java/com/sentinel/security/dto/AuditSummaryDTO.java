package com.sentinel.security.dto;

import java.time.LocalDateTime;

public class AuditSummaryDTO {
    private String userEmail;
    private LocalDateTime timestamp;
    private String action;

    public AuditSummaryDTO(){}

    public AuditSummaryDTO(String userEmail, LocalDateTime timestamp, String action) {
        this.userEmail = userEmail;
        this.timestamp = timestamp;
        this.action = action;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }
}
