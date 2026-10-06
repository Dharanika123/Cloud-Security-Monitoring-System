package com.assets.ComputeServer.Service;

import com.assets.ComputeServer.Model.AgentConfig;
import com.assets.ComputeServer.Model.TelemetryPayload;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.jna.platform.win32.Advapi32Util;
import com.sun.jna.platform.win32.WinReg;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.NetworkIF;
import oshi.hardware.UsbDevice;
import oshi.software.os.OSFileStore;

import java.io.File;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Configuration
@EnableScheduling
public class AgentTelemetryService implements SchedulingConfigurer {

    private final RestTemplate restTemplate;
    private final SystemInfo systemInfo = new SystemInfo();
    private AgentConfig config;

    private long[] prevTicks;
    private long prevNetworkBytes = 0;
    private Instant prevNetworkTimestamp;

    // Track state for alerts
    private final Set<String> knownUsbDevices = ConcurrentHashMap.newKeySet();
    private final Set<String> knownInstalledApps = ConcurrentHashMap.newKeySet();
    private boolean isInitialScanDone = false;

    public AgentTelemetryService() {
        // Configure timeouts so network/API halts won't block the thread indefinitely
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        this.restTemplate = new RestTemplate(factory);
    }

    @PostConstruct
    public void loadConfig() {
        try {
            ObjectMapper mapper = new ObjectMapper();

            // Fix: look in current directory, but if it fails, give a warning
            String appDir = System.getProperty("user.dir");
            File configFile = new File(appDir, "config.json");

            if (configFile.exists()) {
                config = mapper.readValue(configFile, AgentConfig.class);
                System.out.println("Loaded config for Asset ID: " + config.getAssetId());
            } else {
                System.err.println("CRITICAL ERROR: config.json not found in " + appDir);
                try { Thread.sleep(5000); } catch (Exception ignored) {}
                System.exit(1);
            }

            // Initialize baseline ticks and network counters
            this.prevTicks = systemInfo.getHardware().getProcessor().getSystemCpuLoadTicks();
            this.prevNetworkBytes = getTotalNetworkBytes();
            this.prevNetworkTimestamp = Instant.now();

            // Offload the heavy initial USB & Registry scanning to a background thread
            // Doing this inside @PostConstruct blocks Spring from completing its startup smoothly
            new Thread(() -> {
                try {
                    scanUsbDevices(false);
                    scanInstalledApplications(false);
                    this.isInitialScanDone = true;
                    System.out.println("Initial hardware & software baseline scan complete.");
                } catch (Exception e) {
                    System.err.println("Warning: Baseline scan failed: " + e.getMessage());
                }
            }, "Baseline-Scanner").start();

        } catch (Exception e) {
            System.err.println("ERROR: Failed to initialize AgentTelemetryService: " + e.getMessage());
            try { Thread.sleep(5000); } catch (Exception ignored) {}
            System.exit(1);
        }
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        if (config == null) return;

        // Use a dedicated high-priority, lightweight thread pool
        // This ensures the agent is prioritized by the OS scheduler even during 90-100% CPU spikes
        ScheduledExecutorService executor = Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r);
            t.setName("SentinelAgent-Worker");
            t.setPriority(Thread.MAX_PRIORITY);
            t.setDaemon(false); // <--- Keep the JVM alive!
            return t;
        });

        taskRegistrar.setScheduler(executor);

        // Periodic Telemetry Reporting
        taskRegistrar.addFixedRateTask(
                this::collectAndSendMetrics,
                Duration.ofSeconds(config.getIntervalSeconds())
        );

        // Periodic Alert Scanning (every 5 seconds)
        executor.scheduleWithFixedDelay(
                this::checkForAlerts,
                5,
                5,
                TimeUnit.SECONDS
        );
    }

    public void collectAndSendMetrics() {
        try {
            // 1. CPU Usage (%)
            CentralProcessor processor = systemInfo.getHardware().getProcessor();
            float cpuLoad = (float) (processor.getSystemCpuLoadBetweenTicks(prevTicks) * 100);
            this.prevTicks = processor.getSystemCpuLoadTicks();

            // 2. Memory Usage (%)
            GlobalMemory memory = systemInfo.getHardware().getMemory();
            long usedMemory = memory.getTotal() - memory.getAvailable();
            float memoryLoad = (float) ((double) usedMemory / memory.getTotal() * 100);

            // 3. Disk Usage (% of total primary disk storage across all drives)
            float diskLoad = calculateDiskUsagePercentage();

            // 4. Network Rate (Megabytes per second - MB/s)
            float networkRateMBps = calculateNetworkRateMBps();

            // Package the Payload
            TelemetryPayload payload = new TelemetryPayload();
            payload.setAssetId(UUID.fromString(config.getAssetId()));
            payload.setCpuUsage(Math.min(100.0f, Math.max(0.0f, cpuLoad)));
            payload.setMemoryUsage(Math.min(100.0f, Math.max(0.0f, memoryLoad)));
            payload.setDiskUsage(Math.min(100.0f, Math.max(0.0f, diskLoad)));
            payload.setNetworkUsage(networkRateMBps);

            // Send to Main/SOC Application
            restTemplate.postForEntity(config.getServerUrl(), payload, Void.class);
            System.out.println(String.format("Telemetry -> CPU: %.1f%% | MEM: %.1f%% | DISK: %.1f%% | NET: %.2f MB/s",
                    cpuLoad, memoryLoad, diskLoad, networkRateMBps));
        } catch (Exception e) {
            System.err.println("Failed to connect or collect telemetry: " + e.getMessage());
        }
    }

    private void checkForAlerts() {
        try {
            if (!isInitialScanDone) return;
            scanUsbDevices(true);
            scanInstalledApplications(true);
        } catch (Exception e) {
            System.err.println("Error during alert checks: " + e.getMessage());
        }
    }

    // TYPE 1 ALERT: New USB or Device Identified
    private void scanUsbDevices(boolean sendAlerts) {
        try {
            List<UsbDevice> usbDevices = systemInfo.getHardware().getUsbDevices(false);
            for (UsbDevice usb : usbDevices) {
                String id = usb.getUniqueDeviceId();
                if (id == null || id.trim().isEmpty()) {
                    id = usb.getName() + "-" + usb.getVendorId() + "-" + usb.getProductId();
                }

                if (!knownUsbDevices.contains(id)) {
                    knownUsbDevices.add(id);
                    if (sendAlerts) {
                        String description = String.format("New USB/Device Detected: %s (Vendor: %s, ProductId: %s)",
                                usb.getName(), usb.getVendor(), usb.getProductId());
                        sendAlert("USB_DETECTED", description);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error reading USB devices: " + e.getMessage());
        }
    }

    // TYPE 2 ALERT: New EXE / Application Installed
    private void scanInstalledApplications(boolean sendAlerts) {
        try {
            String[] registryPaths = {
                    "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
                    "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
            };

            for (String regPath : registryPaths) {
                scanRegistryKey(WinReg.HKEY_LOCAL_MACHINE, regPath, sendAlerts);
            }
            scanRegistryKey(WinReg.HKEY_CURRENT_USER, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall", sendAlerts);

        } catch (Exception e) {
            // Silently ignore if running on non-Windows environment or reading fails
        }
    }

    private void scanRegistryKey(WinReg.HKEY rootKey, String keyPath, boolean sendAlerts) {
        try {
            if (!Advapi32Util.registryKeyExists(rootKey, keyPath)) {
                return;
            }

            String[] subKeys = Advapi32Util.registryGetKeys(rootKey, keyPath);
            for (String subKey : subKeys) {
                String fullSubKeyPath = keyPath + "\\" + subKey;
                String appIdentifier = rootKey.toString() + "\\" + subKey;

                if (!knownInstalledApps.contains(appIdentifier)) {
                    knownInstalledApps.add(appIdentifier);
                    if (sendAlerts) {
                        String displayName = subKey;
                        try {
                            if (Advapi32Util.registryValueExists(rootKey, fullSubKeyPath, "DisplayName")) {
                                displayName = Advapi32Util.registryGetStringValue(rootKey, fullSubKeyPath, "DisplayName");
                            }
                        } catch (Exception ignored) {}

                        String description = String.format("New Application/EXE Installed: %s", displayName);
                        sendAlert("SOFTWARE_INSTALLED", description);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void sendAlert(String alertType, String description) {
        try {
            TelemetryPayload alertPayload = new TelemetryPayload();
            alertPayload.setAssetId(UUID.fromString(config.getAssetId()));
            alertPayload.setAlertType(alertType);
            alertPayload.setAlertDescription(description);

            restTemplate.postForEntity(config.getServerUrl(), alertPayload, Void.class);
            System.out.println(String.format("ALERT SENT [%s] -> %s", alertType, description));
        } catch (Exception e) {
            System.err.println("Failed to send alert to SOC/Server: " + e.getMessage());
        }
    }

    private float calculateDiskUsagePercentage() {
        List<OSFileStore> fileStores = systemInfo.getOperatingSystem().getFileSystem().getFileStores();
        long totalSpace = 0;
        long usableSpace = 0;

        for (OSFileStore fs : fileStores) {
            totalSpace += fs.getTotalSpace();
            usableSpace += fs.getUsableSpace();
        }

        if (totalSpace == 0) return 0.0f;
        long usedSpace = totalSpace - usableSpace;
        return (float) ((double) usedSpace / totalSpace * 100);
    }

    private float calculateNetworkRateMBps() {
        long currentBytes = getTotalNetworkBytes();
        Instant currentTimestamp = Instant.now();

        double elapsedSeconds = Duration.between(prevNetworkTimestamp, currentTimestamp).toMillis() / 1000.0;
        if (elapsedSeconds <= 0) return 0.0f;

        long bytesDelta = Math.max(0, currentBytes - prevNetworkBytes);

        // Update baseline for the next interval
        this.prevNetworkBytes = currentBytes;
        this.prevNetworkTimestamp = currentTimestamp;

        // Convert Bytes/sec to Megabytes/sec (MB/s)
        return (float) ((bytesDelta / elapsedSeconds) / (1024.0 * 1024.0));
    }

    private long getTotalNetworkBytes() {
        long totalBytes = 0;
        List<NetworkIF> networkIFs = systemInfo.getHardware().getNetworkIFs();
        for (NetworkIF net : networkIFs) {
            net.updateAttributes(); // Refreshes live hardware counters
            totalBytes += (net.getBytesRecv() + net.getBytesSent());
        }
        return totalBytes;
    }
}
