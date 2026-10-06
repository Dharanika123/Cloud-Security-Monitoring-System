package com.sentinel.security.service;

import com.sentinel.security.model.AuditLog;
import com.sentinel.security.model.ComplianceCheck;
import com.sentinel.security.model.Incident;
import com.sentinel.security.model.Report;
import com.sentinel.security.model.Vulnerability;
import com.sentinel.security.repo.AuditLogRepository;
import com.sentinel.security.repo.ComplianceCheckRepository;
import com.sentinel.security.repo.IncidentRepository;
import com.sentinel.security.repo.ReportRepository;
import com.sentinel.security.repo.VulnerabilityRepository;
import jakarta.annotation.PostConstruct;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final AuditLogRepository auditLogRepository;
    private final IncidentRepository incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final ComplianceCheckRepository complianceCheckRepository;

    public ReportService(ReportRepository reportRepository,
                         AuditLogRepository auditLogRepository,
                         IncidentRepository incidentRepository,
                         VulnerabilityRepository vulnerabilityRepository,
                         ComplianceCheckRepository complianceCheckRepository) {
        this.reportRepository = reportRepository;
        this.auditLogRepository = auditLogRepository;
        this.incidentRepository = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.complianceCheckRepository = complianceCheckRepository;
    }

    @PostConstruct
    public void initReports() {
        if (reportRepository.count() == 0) {
            generateAndSaveInitialReport("SECURITY_REPORT", "Executive Security Operations Summary", "admin@sentinel.com");
            generateAndSaveInitialReport("AUDIT_REPORT", "System Audit Trail & Event Logs Report", "auditor@sentinel.com");
            generateAndSaveInitialReport("COMPLIANCE_REPORT", "PCI DSS / SOC 2 Compliance Validation", "admin@sentinel.com");
            generateAndSaveInitialReport("RISK_REPORT", "Vulnerability & Patch Risk Assessment", "sec_admin@sentinel.com");
        }
    }

    private void generateAndSaveInitialReport(String type, String title, String userEmail) {
        Report report = new Report(type, title, userEmail, "READY");
        report = reportRepository.save(report);
        try {
            byte[] pdfBytes = buildPdfDocument(report);
            report.setPdfData(pdfBytes);
            reportRepository.save(report);
        } catch (IOException e) {
            report.setStatus("FAILED");
            reportRepository.save(report);
        }
    }

    public List<Report> getAllReports() {
        return reportRepository.findAllByOrderByCreatedDateDesc();
    }

    public Report generateReport(String type, String userEmail) {
        String title = formatTitle(type);
        Report report = new Report(type, title, userEmail, "READY");

        // Save metadata first
        report = reportRepository.save(report);

        try {
            // Render PDF immediately with current snapshot
            byte[] pdfBytes = buildPdfDocument(report);
            report.setPdfData(pdfBytes);
            report = reportRepository.save(report);
        } catch (IOException e) {
            report.setStatus("FAILED");
            reportRepository.save(report);
        }

        auditLogRepository.save(new AuditLog(userEmail, "Report Generated", "Reports", report.getId().toString(), title, "SUCCESS", "127.0.0.1"));
        return report;
    }

    public byte[] exportReportPdf(UUID reportId) throws IOException {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        if (report.getPdfData() != null && report.getPdfData().length > 0) {
            return report.getPdfData();
        }

        // Fallback in case PDF was not generated at creation
        byte[] pdfBytes = buildPdfDocument(report);
        report.setPdfData(pdfBytes);
        reportRepository.save(report);
        return pdfBytes;
    }

    public byte[] buildPdfDocument(Report report) throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font fontReg = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                // --- 1. TOP HEADER BANNER ---
                cs.setNonStrokingColor(new Color(27, 30, 36)); // #1B1E24
                cs.addRect(0, 715, 612, 80);
                cs.fill();

                // Header Title
                cs.setNonStrokingColor(new Color(245, 34, 45)); // #F5222D Red Accent
                cs.setFont(fontBold, 18);
                writeText(cs, 30, 760, "SENTINELCORE SECUREOPS");

                cs.setNonStrokingColor(Color.WHITE);
                cs.setFont(fontBold, 12);
                writeText(cs, 30, 735, "SYSTEM REPORT: " + report.getReportType().replace("_", " "));

                // Top Accent Line
                cs.setNonStrokingColor(new Color(245, 34, 45));
                cs.addRect(0, 712, 612, 3);
                cs.fill();

                // --- 2. REPORT METADATA SECTION ---
                cs.setNonStrokingColor(new Color(140, 155, 165));
                cs.setFont(fontReg, 9);
                writeText(cs, 30, 690, "REPORT TITLE: " + report.getTitle());
                writeText(cs, 30, 675, "GENERATED BY: " + report.getGeneratedBy());
                writeText(cs, 300, 675, "DATE: " + report.getCreatedDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

                // --- 3. METRIC DASHBOARD CARDS ---
                long activeIncidents = incidentRepository.findAll().stream().filter(i -> !"RESOLVED".equalsIgnoreCase(i.getStatus().name())).count();
                long openVulns = vulnerabilityRepository.findAll().stream().filter(v -> !"PATCHED".equalsIgnoreCase(v.getPatchStatus().name())).count();
                long auditLogsCount = auditLogRepository.count();

                drawCard(cs, 30, 580, 125, 60, "ACTIVE INCIDENTS", String.valueOf(activeIncidents), new Color(245, 34, 45));
                drawCard(cs, 170, 580, 125, 60, "OPEN CVEs", String.valueOf(openVulns), new Color(250, 140, 22));
                drawCard(cs, 310, 580, 125, 60, "AUDIT LOGS", String.valueOf(auditLogsCount), new Color(24, 144, 255));
                drawCard(cs, 450, 580, 130, 60, "COMPLIANCE", "100%", new Color(82, 196, 26));

                // --- 4. DYNAMIC REPORT-SPECIFIC DATA TABLE ---
                float y = 530;
                cs.setNonStrokingColor(new Color(27, 30, 36));
                cs.setFont(fontBold, 12);
                writeText(cs, 30, y, "DETAILED LOGS & RECENT SECURITY EVENTS");

                y -= 20;

                String type = report.getReportType().toUpperCase();
                y = drawTableHeader(cs, y, getHeadersForReport(type));

                switch (type) {
                    case "AUDIT_REPORT":
                        renderAuditLogsTable(cs, y);
                        break;
                    case "SECURITY_REPORT":
                        renderIncidentsTable(cs, y);
                        break;
                    case "RISK_REPORT":
                        renderVulnerabilitiesTable(cs, y);
                        break;
                    case "COMPLIANCE_REPORT":
                        renderComplianceChecksTable(cs, y);
                        break;
                    default:
                        renderAuditLogsTable(cs, y);
                        break;
                }

                // --- 5. FOOTER DISCLAIMER ---
                cs.setNonStrokingColor(new Color(240, 242, 245));
                cs.addRect(0, 0, 612, 40);
                cs.fill();

                cs.setNonStrokingColor(new Color(100, 110, 120));
                cs.setFont(fontBold, 7);
                writeText(cs, 30, 20, "THIS SECURITY REPORT GENERATED FROM REAL-TIME MONITORING APIS IS CLASSIFIED AS CONFIDENTIAL");
                writeText(cs, 480, 20, "SENTINELCORE SECUREOPS");
            }

            document.save(out);
            return out.toByteArray();
        }
    }

    private String[] getHeadersForReport(String reportType) {
        switch (reportType.toUpperCase()) {
            case "AUDIT_REPORT":
                return new String[]{"USER", "ACTION", "TARGET", "STATUS", "TIME"};
            case "SECURITY_REPORT":
                return new String[]{"TICKET", "TYPE", "SEVERITY", "STATUS", "TEAM"};
            case "RISK_REPORT":
                return new String[]{"CVE CODE", "SEVERITY", "CVSS", "STATUS", "TITLE"};
            case "COMPLIANCE_REPORT":
                return new String[]{"FRAMEWORK", "PASSED", "TOTAL", "SCORE", "STATUS"};
            default:
                return new String[]{"USER", "ACTION", "TARGET", "STATUS", "TIME"};
        }
    }

    // 1. Audit Logs Table
    private float renderAuditLogsTable(PDPageContentStream cs, float y) throws IOException {
        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontReg = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc();
        int limit = Math.min(logs.size(), 12);

        for (int i = 0; i < limit; i++) {
            AuditLog log = logs.get(i);
            Color rowBg = (i % 2 == 0) ? new Color(245, 247, 250) : Color.WHITE;

            cs.setNonStrokingColor(rowBg);
            cs.addRect(30, y - 5, 552, 18);
            cs.fill();

            cs.setNonStrokingColor(Color.DARK_GRAY);
            cs.setFont(fontReg, 8);
            writeText(cs, 35, y, truncate(log.getUserEmail(), 18));
            writeText(cs, 130, y, truncate(log.getAction(), 20));
            writeText(cs, 250, y, truncate(log.getAffectedEntityName() != null ? log.getAffectedEntityName() : log.getResource(), 22));

            cs.setNonStrokingColor("SUCCESS".equalsIgnoreCase(log.getStatus()) ? new Color(82, 196, 26) : new Color(245, 34, 45));
            cs.setFont(fontBold, 8);
            writeText(cs, 360, y, log.getStatus());

            cs.setNonStrokingColor(Color.GRAY);
            cs.setFont(fontReg, 8);
            writeText(cs, 470, y, log.getTimestamp() != null ? log.getTimestamp().format(DateTimeFormatter.ofPattern("MM-dd HH:mm")) : "N/A");

            y -= 18;
        }
        return y;
    }

    // 2. Incidents Table
    private float renderIncidentsTable(PDPageContentStream cs, float y) throws IOException {
        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontReg = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        List<Incident> incidents = incidentRepository.findAll();
        int limit = Math.min(incidents.size(), 12);

        for (int i = 0; i < limit; i++) {
            Incident inc = incidents.get(i);
            Color rowBg = (i % 2 == 0) ? new Color(245, 247, 250) : Color.WHITE;

            cs.setNonStrokingColor(rowBg);
            cs.addRect(30, y - 5, 552, 18);
            cs.fill();

            cs.setNonStrokingColor(Color.DARK_GRAY);
            cs.setFont(fontReg, 8);
            writeText(cs, 35, y, inc.getIncidentTicket() != null ? inc.getIncidentTicket() : "INC-" + (i + 1));
            writeText(cs, 130, y, truncate(inc.getType(), 20));

            cs.setNonStrokingColor("CRITICAL".equalsIgnoreCase(inc.getSeverity().name()) || "HIGH".equalsIgnoreCase(inc.getSeverity().name())
                    ? new Color(245, 34, 45) : new Color(250, 140, 22));
            cs.setFont(fontBold, 8);
            writeText(cs, 250, y, inc.getSeverity().name());

            cs.setNonStrokingColor(Color.DARK_GRAY);
            cs.setFont(fontReg, 8);
            writeText(cs, 360, y, inc.getStatus().name());
            writeText(cs, 470, y, truncate(inc.getAssignedTeam() != null ? inc.getAssignedTeam() : "Security Ops", 15));

            y -= 18;
        }
        return y;
    }

    // 3. Vulnerabilities Table
    private float renderVulnerabilitiesTable(PDPageContentStream cs, float y) throws IOException {
        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontReg = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        List<Vulnerability> vulns = vulnerabilityRepository.findAll();
        int limit = Math.min(vulns.size(), 12);

        for (int i = 0; i < limit; i++) {
            Vulnerability v = vulns.get(i);
            Color rowBg = (i % 2 == 0) ? new Color(245, 247, 250) : Color.WHITE;

            cs.setNonStrokingColor(rowBg);
            cs.addRect(30, y - 5, 552, 18);
            cs.fill();

            cs.setNonStrokingColor(Color.DARK_GRAY);
            cs.setFont(fontReg, 8);
            writeText(cs, 35, y, truncate(v.getCveId(), 18));

            cs.setNonStrokingColor("CRITICAL".equalsIgnoreCase(v.getSeverity().name()) ? new Color(245, 34, 45) : new Color(250, 140, 22));
            cs.setFont(fontBold, 8);
            writeText(cs, 130, y, v.getSeverity().name());

            cs.setNonStrokingColor(Color.DARK_GRAY);
            cs.setFont(fontReg, 8);
            writeText(cs, 250, y, String.valueOf(v.getCvssScore()));
            writeText(cs, 360, y, v.getPatchStatus().name());
            writeText(cs, 470, y, truncate(v.getTitle(), 15));

            y -= 18;
        }
        return y;
    }

    // 4. Compliance Frameworks Table
    private float renderComplianceChecksTable(PDPageContentStream cs, float y) throws IOException {
        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontReg = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        List<ComplianceCheck> checks = complianceCheckRepository.findAll();

        for (int i = 0; i < checks.size(); i++) {
            ComplianceCheck c = checks.get(i);
            Color rowBg = (i % 2 == 0) ? new Color(245, 247, 250) : Color.WHITE;

            cs.setNonStrokingColor(rowBg);
            cs.addRect(30, y - 5, 552, 18);
            cs.fill();

            cs.setNonStrokingColor(Color.DARK_GRAY);
            cs.setFont(fontBold, 8);
            writeText(cs, 35, y, c.getFramework());

            cs.setFont(fontReg, 8);
            writeText(cs, 130, y, String.valueOf(c.getPassedControls()));
            writeText(cs, 250, y, String.valueOf(c.getTotalControls()));
            writeText(cs, 360, y, c.getScorePercentage() + "%");

            cs.setNonStrokingColor("COMPLIANT".equalsIgnoreCase(c.getStatus()) ? new Color(82, 196, 26) : new Color(245, 34, 45));
            cs.setFont(fontBold, 8);
            writeText(cs, 470, y, c.getStatus());

            y -= 18;
        }
        return y;
    }

    private void drawCard(PDPageContentStream cs, float x, float y, float w, float h, String title, String value, Color accentColor) throws IOException {
        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDType1Font fontReg = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

        // Background
        cs.setNonStrokingColor(new Color(245, 247, 250));
        cs.addRect(x, y, w, h);
        cs.fill();

        // Left Border
        cs.setNonStrokingColor(accentColor);
        cs.addRect(x, y, 4, h);
        cs.fill();

        // Title
        cs.setNonStrokingColor(new Color(120, 130, 140));
        cs.setFont(fontReg, 7);
        writeText(cs, x + 10, y + h - 15, title);

        // Value
        cs.setNonStrokingColor(accentColor);
        cs.setFont(fontBold, 16);
        writeText(cs, x + 10, y + 15, value);
    }

    private float drawTableHeader(PDPageContentStream cs, float y, String[] headers) throws IOException {
        PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

        cs.setNonStrokingColor(new Color(40, 44, 52));
        cs.addRect(30, y - 5, 552, 20);
        cs.fill();

        cs.setNonStrokingColor(Color.WHITE);
        cs.setFont(fontBold, 8);
        writeText(cs, 35, y, headers[0]);
        writeText(cs, 130, y, headers[1]);
        writeText(cs, 250, y, headers[2]);
        writeText(cs, 360, y, headers[3]);
        writeText(cs, 470, y, headers[4]);

        return y - 20;
    }

    private void writeText(PDPageContentStream stream, float x, float y, String text) throws IOException {
        stream.beginText();
        stream.newLineAtOffset(x, y);
        stream.showText(text != null ? text : "");
        stream.endText();
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "N/A";
        return text.length() > maxLen ? text.substring(0, maxLen - 3) + "..." : text;
    }

    private String formatTitle(String type) {
        switch (type.toUpperCase()) {
            case "SECURITY_REPORT": return "Security Operations Executive Report";
            case "AUDIT_REPORT": return "System Audit Trail & Event Logs Report";
            case "COMPLIANCE_REPORT": return "Regulatory Compliance Audit (PCI DSS / SOC 2)";
            case "RISK_REPORT": return "Vulnerability & Patch Risk Assessment";
            default: return "Custom Security Audit Report";
        }
    }
}