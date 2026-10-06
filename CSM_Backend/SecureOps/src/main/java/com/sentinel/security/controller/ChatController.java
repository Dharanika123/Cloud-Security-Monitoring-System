package com.sentinel.security.controller;

import com.sentinel.security.dto.ChatRequestDTO;
import com.sentinel.security.dto.ChatResponseDTO;
import com.sentinel.security.model.User;
import com.sentinel.security.repo.UserRepository;
import com.sentinel.security.service.AIChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private final AIChatService aiChatService;
    private final UserRepository userRepository;

    public ChatController(AIChatService aiChatService, UserRepository userRepository) {
        this.aiChatService = aiChatService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDTO> chat(@RequestBody ChatRequestDTO request, Authentication authentication) {
        String username = (authentication != null && authentication.getName() != null)
                ? authentication.getName()
                : "anonymous";

        User user = userRepository.findByUsername(username).orElse(null);

        ChatResponseDTO response = aiChatService.processUserMessage(request, user);
        return ResponseEntity.ok(response);
    }
}