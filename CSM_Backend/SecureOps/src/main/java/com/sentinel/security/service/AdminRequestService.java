package com.sentinel.security.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinel.security.model.AdminRequest;
import com.sentinel.security.model.Asset;
import com.sentinel.security.model.User;
import com.sentinel.security.repo.AdminRequestRepository;
import com.sentinel.security.repo.AssetRepository;
import com.sentinel.security.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AdminRequestService {

    private final AdminRequestRepository requestRepository;
    private final AssetRepository assetRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public AdminRequestService(AdminRequestRepository requestRepository,
                               AssetRepository assetRepository,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               ObjectMapper objectMapper) {
        this.requestRepository = requestRepository;
        this.assetRepository = assetRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    public AdminRequest createRequest(AdminRequest.RequestType type, User requester, String title, String details) {
        AdminRequest request = new AdminRequest(type, requester, title, details);
        return requestRepository.save(request);
    }

    public List<AdminRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    public List<AdminRequest> getUserRequests(User requester) {
        return requestRepository.findByRequester(requester);
    }

    @Transactional
    public AdminRequest processRequest(Long requestId, boolean approve, String adminComment) {
        AdminRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != AdminRequest.RequestStatus.PENDING) {
            throw new IllegalStateException("Request has already been processed.");
        }

        request.setAdminComment(adminComment);
        request.setUpdatedAt(LocalDateTime.now());

        if (approve) {
            request.setStatus(AdminRequest.RequestStatus.APPROVED);
            executeApprovedRequest(request);
        } else {
            request.setStatus(AdminRequest.RequestStatus.REJECTED);
        }

        return requestRepository.save(request);
    }

    private void executeApprovedRequest(AdminRequest request) {
        try {
            switch (request.getRequestType()) {
                case CREATE_ASSET:
                    JsonNode node = objectMapper.readTree(request.getDetails());
                    String ip = node.has("ip") ? node.get("ip").asText() : "127.0.0.1";
                    String name = node.get("name").asText();
                    Asset.AssetType type = Asset.AssetType.valueOf(node.get("type").asText());
                    Asset.HealthStatus status = node.has("status")
                            ? Asset.HealthStatus.valueOf(node.get("status").asText())
                            : Asset.HealthStatus.HEALTHY;

                    Asset newAsset = new Asset(UUID.randomUUID(), ip, name, type, status);
                    assetRepository.save(newAsset);
                    break;

                case PASSWORD_CHANGE:
                    User user = request.getRequester();
                    user.setPassword(passwordEncoder.encode(request.getDetails()));
                    userRepository.save(user);
                    break;

                case GENERIC_ACTION:
                case MESSAGE:
                    // Acknowledged and handled
                    break;
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to execute approved request action: " + e.getMessage(), e);
        }
    }
}