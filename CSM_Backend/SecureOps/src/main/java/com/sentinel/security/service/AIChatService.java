package com.sentinel.security.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sentinel.security.dto.ChatRequestDTO;
import com.sentinel.security.dto.ChatResponseDTO;
import com.sentinel.security.model.User;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@Service
public class AIChatService {

    @Value("${sentinelcore.ai.opencode.api-key}")
    private String rawOmniRouteApiKey;

    @Value("${sentinelcore.ai.opencode.model}")
    private String comboModelId;

    @Value("${sentinelcore.ai.opencode.endpoint}")
    private String apiEndpoint;

    private String omniRouteApiKey;

    private final ChatOpsToolService opsToolService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public AIChatService(ChatOpsToolService opsToolService) {
        this.opsToolService = opsToolService;
    }

    @PostConstruct
    public void initApiKey() {
        this.omniRouteApiKey = decodeIfNeeded(rawOmniRouteApiKey);
    }

    private String decodeIfNeeded(String key) {
        if (key == null || key.isBlank()) return key;
        String trimmed = key.trim();
        if (trimmed.startsWith("ENC:")) {
            try {
                byte[] decodedBytes = java.util.Base64.getDecoder().decode(trimmed.substring(4));
                return new String(decodedBytes, java.nio.charset.StandardCharsets.UTF_8).trim();
            } catch (Exception e) {
                System.err.println("Failed to decode encoded API key: " + e.getMessage());
                return trimmed;
            }
        }
        return trimmed;
    }

    public ChatResponseDTO processUserMessage(ChatRequestDTO request, User currentUser) {
        String userRole = (currentUser != null && currentUser.getRole() != null)
                ? currentUser.getRole().toString()
                : "OPERATOR";
        String userPrompt = request.getMessage();

        // Fallback to local logic if no API key is set
        if (omniRouteApiKey == null || omniRouteApiKey.isBlank() || omniRouteApiKey.contains("YOUR_API_KEY")) {
            return generateIntelligentLocalResponse(userPrompt, userRole);
        }

        try {
            return callOmniRouteGateway(request, currentUser);
        } catch (HttpStatusCodeException httpEx) {
            System.err.println("OmniRoute Gateway failed (" + httpEx.getStatusCode() + "): " + httpEx.getResponseBodyAsString());
        } catch (Exception e) {
            System.err.println("Error calling OmniRoute: " + e.getMessage());
        }

        return generateIntelligentLocalResponse(userPrompt, userRole);
    }

    private ChatResponseDTO callOmniRouteGateway(ChatRequestDTO request, User currentUser) throws Exception {
        String username = currentUser != null ? currentUser.getUsername() : "User";
        String role = currentUser != null && currentUser.getRole() != null ? currentUser.getRole().toString() : "OPERATOR";

        // NEW: Check if the user is asking about a specific asset's status or CPU
        String specificAssetData = "";
        String lowerPrompt = request.getMessage().toLowerCase();
        if (lowerPrompt.contains("cpu") || lowerPrompt.contains("status") || lowerPrompt.contains("telemetry")) {
            specificAssetData = " | Specific Asset Context: " + opsToolService.getTelemetryFromPrompt(request.getMessage());
        }

        String liveContext = String.format(
                "[LIVE SYSTEM METRICS: %s | %s | %s | %s%s]",
                opsToolService.getCriticalAssetsCount(),
                opsToolService.getCloudAssetsSummary("CLOUD_AWS"),
                opsToolService.getIncidentSummary(),
                opsToolService.getVulnerabilitySummary(),
                specificAssetData // Injected dynamically if requested
        );

        String systemInstruction = "You are SentinelBot, the AI Copilot for SentinelCore.\n" +
                "Authenticated User: '" + username + "' | Role: '" + role + "'.\n" +
                "Live System Telemetry: " + liveContext + "\n\n" +
                "STRICT RESPONSE RULES:\n" +
                "1. Be direct, concise, and professional. Avoid conversational filler or introductory fluff.\n" +
                "2. DO NOT dump system metrics unless the user explicitly asks for stats or status.\n" +
                "3. PERMISSIONS & ROLE BEHAVIOR:\n" +
                "   - If role is 'ADMIN' or 'SUPER_ADMIN': Give direct 4-step instructions to create an asset via the Assets page.\n" +
                "   - If role is NOT Admin (e.g. 'EMPLOYEE', 'OPERATOR'): State in ONE sentence that their role lacks direct create permissions, then provide 3 brief steps to submit an Asset Creation request via the 'Requests' page in the sidebar.\n" +
                "4. FORMATTING:\n" +
                "   - Use clean Markdown with bold keywords and concise bullet points.\n" +
                "   - Keep total response length under 100 words whenever possible.";

        ObjectNode rootNode = mapper.createObjectNode();
        rootNode.put("model", comboModelId);

        ArrayNode messagesArray = rootNode.putArray("messages");

        // System prompt
        ObjectNode sysMessage = messagesArray.addObject();
        sysMessage.put("role", "system");
        sysMessage.put("content", systemInstruction);

        // Chat History
        if (request.getHistory() != null) {
            for (ChatRequestDTO.ChatMessageHistory h : request.getHistory()) {
                ObjectNode historyMsg = messagesArray.addObject();
                historyMsg.put("role", h.getRole());
                historyMsg.put("content", h.getContent());
            }
        }

        // Current User Message
        ObjectNode userMessage = messagesArray.addObject();
        userMessage.put("role", "user");
        userMessage.put("content", request.getMessage());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + omniRouteApiKey.trim());

        HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(rootNode), headers);
        ResponseEntity<String> response = restTemplate.postForEntity(apiEndpoint, entity, String.class);

        JsonNode responseJson = mapper.readTree(response.getBody());
        JsonNode choices = responseJson.path("choices");

        if (choices.isArray() && !choices.isEmpty()) {
            String reply = choices.get(0).path("message").path("content").asText();
            return new ChatResponseDTO(reply);
        }

        return generateIntelligentLocalResponse(request.getMessage(), role);
    }

    private ChatResponseDTO generateIntelligentLocalResponse(String prompt, String userRole) {
        String query = prompt.toLowerCase().trim();

        if (query.contains("recipe") || query.contains("movie") || query.contains("song") || query.contains("football") || query.contains("weather")) {
            return new ChatResponseDTO("I am **SentinelBot**, your SecureOps AI assistant. I specialize only in cybersecurity, infrastructure monitoring, compliance, and SentinelCore platform operations.");
        }

        if (query.contains("what is asset") || query.contains("what is an asset")) {
            return new ChatResponseDTO("**Asset**: An asset represents monitored physical servers (`SERVER`), cloud instances (`CLOUD_AWS`, `CLOUD_AZURE`), or container pods (`K8S_POD`) tracked for health, telemetry, and vulnerabilities.");
        }
        if (query.contains("what is alert") || query.contains("what is an alert")) {
            return new ChatResponseDTO("**Alert**: An automated notification triggered when real-time telemetry (CPU, Memory, Disk) or threat detection sensors exceed predefined safety thresholds.");
        }
        if (query.contains("what is incident") || query.contains("what is an incident")) {
            return new ChatResponseDTO("**Incident**: A confirmed security event (such as unauthorized access, malware, or brute-force attempts) requiring investigation, containment, SLA tracking, and resolution.");
        }

        if (query.contains("create") && query.contains("asset")) {
            if ("ADMIN".equalsIgnoreCase(userRole) || "SUPER_ADMIN".equalsIgnoreCase(userRole)) {
                return new ChatResponseDTO("As an **" + userRole + "**, you have direct clearance.\n\n" +
                        "**Steps to create an asset:**\n" +
                        "1. Navigate to the **Assets** page.\n" +
                        "2. Click the **'+ Add Asset'** button.\n" +
                        "3. Enter the Asset Name, IP Address, Type (`SERVER`, `CLOUD_AWS`, `CLOUD_AZURE`, `K8S_POD`), and Health Status.\n" +
                        "4. Click **Save**.");
            } else {
                return new ChatResponseDTO("Your current role is **" + userRole + "**. You do not have direct permission to create assets.\n\n" +
                        "**How to request asset creation:**\n" +
                        "1. Go to the **Requests** tab in the sidebar.\n" +
                        "2. Click **'New Admin Request'** and select `ASSET_CREATION`.\n" +
                        "3. Submit the asset details (Name, Type, IP) and business justification.\n" +
                        "4. An Administrator will review and approve your request.",
                        true, "NAVIGATE_REQUESTS");
            }
        }

        if (query.contains("critical") && query.contains("asset")) {
            return new ChatResponseDTO(opsToolService.getCriticalAssetsCount());
        }

        if (query.contains("aws") || query.contains("cloud") || query.contains("azure")) {
            String target = query.contains("azure") ? "CLOUD_AZURE" : "CLOUD_AWS";
            return new ChatResponseDTO(opsToolService.getCloudAssetsSummary(target));
        }

        // NEW: Handles the local fallback exactly like the AI
        if (query.contains("cpu") || query.contains("status") || query.contains("telemetry")) {
            return new ChatResponseDTO(opsToolService.getTelemetryFromPrompt(prompt));
        }

        if (query.contains("incident") || query.contains("sla") || query.contains("mttr")) {
            return new ChatResponseDTO(opsToolService.getIncidentSummary() + " Navigate to the **Incidents** page to inspect SLA timelines.");
        }

        return new ChatResponseDTO("I analyzed your inquiry regarding **'" + prompt + "'**. You can ask about:\n- *'How many assets are in critical?'*\n- *'What is the CPU status of <Asset-Name>?'*\n- *'How to create an asset?'*\n- *'What is an Incident or Alert?'*");
    }
}