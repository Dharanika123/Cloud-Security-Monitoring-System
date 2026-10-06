package com.sentinel.security.dto;

import com.sentinel.security.model.User.MyRole;

public class CreateUserRequest {
    private String username;
    private String email;
    private String password;
    private MyRole role;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public MyRole getRole() { return role; }
    public void setRole(MyRole role) { this.role = role; }
}