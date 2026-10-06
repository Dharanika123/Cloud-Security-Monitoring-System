package com.sentinel.security.controller;

import com.sentinel.security.model.AdminRequest;
import com.sentinel.security.model.User;
import com.sentinel.security.repo.UserRepository;
import com.sentinel.security.service.AdminRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
public class AdminRequestController {

    private final AdminRequestService requestService;
    private final UserRepository userRepository;

    public AdminRequestController(AdminRequestService requestService, UserRepository userRepository) {
        this.requestService = requestService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication auth) {
        String identifier = auth.getName();
        return userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findByUsername(identifier)
                        .orElseThrow(() -> new RuntimeException("User not found for identifier: " + identifier)));
    }

    @PostMapping
    public ResponseEntity<AdminRequest> submitRequest(@RequestBody Map<String, String> body, Authentication auth) {
        User user = getAuthenticatedUser(auth);

        AdminRequest.RequestType type = AdminRequest.RequestType.valueOf(body.get("type"));
        String title = body.getOrDefault("title", "Request from " + user.getUsername());
        String details = body.get("details");

        return ResponseEntity.ok(requestService.createRequest(type, user, title, details));
    }

    @GetMapping("/my-requests")
    public ResponseEntity<List<AdminRequest>> getMyRequests(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(requestService.getUserRequests(user));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<List<AdminRequest>> getAllRequests() {
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    @PutMapping("/{id}/process")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<AdminRequest> processRequest(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        boolean approve = Boolean.TRUE.equals(body.get("approve"));
        String comment = (String) body.getOrDefault("comment", "");
        return ResponseEntity.ok(requestService.processRequest(id, approve, comment));
    }
}