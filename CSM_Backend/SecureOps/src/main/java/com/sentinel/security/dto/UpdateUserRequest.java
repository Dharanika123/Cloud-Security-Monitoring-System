package com.sentinel.security.dto;

import com.sentinel.security.model.User.MyRole;

public class UpdateUserRequest {
    private String email;
    private String password; // Optional: leaves unchanged if null or empty
    private MyRole role;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public MyRole getRole() { return role; }
    public void setRole(MyRole role) { this.role = role; }
}