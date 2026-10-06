package com.sentinel.security.config;

import com.sentinel.security.model.Asset;
import com.sentinel.security.model.AuditLog;
import com.sentinel.security.model.Incident;
import com.sentinel.security.model.Vulnerability;
import com.sentinel.security.repo.AssetRepository;
import com.sentinel.security.repo.AuditLogRepository;
import com.sentinel.security.repo.IncidentRepository;
import com.sentinel.security.repo.VulnerabilityRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final AssetRepository assetRepository;
    private final IncidentRepository incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;

    private static final Map<String, String[]> ACTION_MAP = new HashMap<>();

    static {
        // Authentication & User
        ACTION_MAP.put("AuthController.login", new String[]{"User Login", "Authentication"});
        ACTION_MAP.put("AuthController.register", new String[]{"User Created", "User & Access Management"});
        ACTION_MAP.put("UserController.createUser", new String[]{"User Created", "User & Access Management"});
        ACTION_MAP.put("UserController.updateUser", new String[]{"User Updated", "User & Access Management"});
        ACTION_MAP.put("UserController.deleteUser", new String[]{"User Deleted", "User & Access Management"});

        // Asset Management
        ACTION_MAP.put("AssetController.registerAsset", new String[]{"Asset Created", "Asset Management"});
        ACTION_MAP.put("AssetController.updateAsset", new String[]{"Asset Updated", "Asset Management"});
        ACTION_MAP.put("AssetController.deleteAsset", new String[]{"Asset Deleted", "Asset Management"});

        // Infrastructure Monitoring
        ACTION_MAP.put("MetricController.recordMetric", new String[]{"Threshold Evaluation", "Infrastructure Monitoring"});
        ACTION_MAP.put("AlertController.resolveAlert", new String[]{"Alert Resolved", "Infrastructure Monitoring"});
        ACTION_MAP.put("AlertController.acknowledgeAlert", new String[]{"Alert Acknowledged", "Infrastructure Monitoring"});

        // Incident Management
        ACTION_MAP.put("IncidentController.createIncident", new String[]{"Incident Created", "Incident Management"});
        ACTION_MAP.put("IncidentController.updateIncident", new String[]{"Incident Updated", "Incident Management"});
        ACTION_MAP.put("IncidentController.assignIncident", new String[]{"Incident Assigned", "Incident Management"});
        ACTION_MAP.put("IncidentController.resolveIncident", new String[]{"Incident Resolved", "Incident Management"});

        // Vulnerability Management
        ACTION_MAP.put("VulnerabilityController.createVulnerability", new String[]{"Vulnerability Created", "Vulnerability Management"});
        ACTION_MAP.put("VulnerabilityController.applyPatch", new String[]{"Patch Applied", "Vulnerability Management"});
        ACTION_MAP.put("VulnerabilityController.runScan", new String[]{"Scan Completed", "Vulnerability Management"});
    }

    public AuditAspect(AuditLogRepository auditLogRepository,
                       AssetRepository assetRepository,
                       IncidentRepository incidentRepository,
                       VulnerabilityRepository vulnerabilityRepository) {
        this.auditLogRepository = auditLogRepository;
        this.assetRepository = assetRepository;
        this.incidentRepository = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
    }

    @Around("execution(* com.sentinel.security.controller..*(..))")
    public Object logControllerActions(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String key = className + "." + methodName;

        if (methodName.startsWith("get") || methodName.startsWith("fetch") || methodName.startsWith("check")) {
            return joinPoint.proceed();
        }

        String[] mappedInfo = ACTION_MAP.getOrDefault(key, new String[]{formatActionName(methodName), className.replace("Controller", "")});
        String readableAction = mappedInfo[0];
        String readableCategory = mappedInfo[1];

        // Resolve Target UUID and Name before the action executes (Crucial for DELETE)
        String[] targetDetails = resolveTargetDetails(joinPoint, readableCategory);
        String targetId = targetDetails[0];
        String targetName = targetDetails[1];

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser"))
                ? auth.getName() : "admin@sentinel.com";

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        String ipAddress = "127.0.0.1";
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            ipAddress = (xForwardedFor != null && !xForwardedFor.isEmpty()) ? xForwardedFor.split(",")[0] : request.getRemoteAddr();
        }

        String status = "SUCCESS";
        Object result;
        try {
            result = joinPoint.proceed();
        } catch (Throwable throwable) {
            status = "FAILED";
            auditLogRepository.save(new AuditLog(userEmail, readableAction, readableCategory, targetId, targetName, status, ipAddress));
            throw throwable;
        }

        auditLogRepository.save(new AuditLog(userEmail, readableAction, readableCategory, targetId, targetName, status, ipAddress));
        return result;
    }

    private String[] resolveTargetDetails(ProceedingJoinPoint joinPoint, String category) {
        Object[] args = joinPoint.getArgs();
        UUID uuidParam = null;
        String nameParam = null;

        // 1. Scan method arguments for UUIDs, Strings, or Model Entities
        if (args != null) {
            for (Object arg : args) {
                if (arg == null) continue;

                if (arg instanceof UUID) {
                    uuidParam = (UUID) arg;
                } else if (arg instanceof String) {
                    String str = (String) arg;
                    try {
                        uuidParam = UUID.fromString(str);
                    } catch (IllegalArgumentException e) {
                        if (str.contains("@") || str.startsWith("CVE-") || str.startsWith("INC-")) {
                            nameParam = str;
                        }
                    }
                } else {
                    // Extract via reflection from Entity/DTO
                    String extractedId = getFieldValue(arg, "id");
                    if (extractedId != null) {
                        try {
                            uuidParam = UUID.fromString(extractedId);
                        } catch (Exception ignored) {}
                    }
                    if (nameParam == null) {
                        nameParam = getFieldValue(arg, "name");
                        if (nameParam == null) nameParam = getFieldValue(arg, "title");
                        if (nameParam == null) nameParam = getFieldValue(arg, "cve");
                        if (nameParam == null) nameParam = getFieldValue(arg, "email");
                    }
                }
            }
        }

        // 2. Perform database lookup with UUID before deletion
        if (uuidParam != null) {
            String uuidStr = uuidParam.toString();
            if ("Asset Management".equalsIgnoreCase(category) || "Asset".equalsIgnoreCase(category)) {
                Optional<Asset> asset = assetRepository.findById(uuidParam);
                if (asset.isPresent()) {
                    return new String[]{uuidStr, asset.get().getName()};
                }
            } else if ("Incident Management".equalsIgnoreCase(category) || "Incident".equalsIgnoreCase(category)) {
                Optional<Incident> incident = incidentRepository.findById(uuidParam);
                if (incident.isPresent()) {
                    return new String[]{uuidStr, incident.get().getIncidentTicket()};
                }
            } else if ("Vulnerability Management".equalsIgnoreCase(category) || "Vulnerability".equalsIgnoreCase(category)) {
                Optional<Vulnerability> vuln = vulnerabilityRepository.findById(uuidParam);
                if (vuln.isPresent()) {
                    return new String[]{uuidStr, vuln.get().getCveId()};
                }
            }
            return new String[]{uuidStr, nameParam != null ? nameParam : category + " Object"};
        }

        return new String[]{"N/A", nameParam != null ? nameParam : category + " Object"};
    }

    private String getFieldValue(Object object, String fieldName) {
        try {
            Field field = getDeclaredFieldRecursive(object.getClass(), fieldName);
            if (field != null) {
                field.setAccessible(true);
                Object val = field.get(object);
                return val != null ? val.toString() : null;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private Field getDeclaredFieldRecursive(Class<?> clazz, String fieldName) {
        try {
            return clazz.getDeclaredField(fieldName);
        } catch (NoSuchFieldException e) {
            if (clazz.getSuperclass() != null) {
                return getDeclaredFieldRecursive(clazz.getSuperclass(), fieldName);
            }
        }
        return null;
    }

    private String formatActionName(String methodName) {
        String pascalCase = methodName.substring(0, 1).toUpperCase() + methodName.substring(1);
        return pascalCase.replaceAll("([a-z])([A-Z])", "$1 $2");
    }
}