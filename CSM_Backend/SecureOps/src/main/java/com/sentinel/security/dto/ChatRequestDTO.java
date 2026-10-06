package com.sentinel.security.dto;

import java.util.List;

public class ChatRequestDTO {
    private String message;
    private List<ChatMessageHistory> history;

    public static class ChatMessageHistory {
        private String role; // "user" or "assistant"
        private String content;

        public ChatMessageHistory() {}
        public ChatMessageHistory(String role, String content) {
            this.role = role;
            this.content = content;
        }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<ChatMessageHistory> getHistory() { return history; }
    public void setHistory(List<ChatMessageHistory> history) { this.history = history; }
}