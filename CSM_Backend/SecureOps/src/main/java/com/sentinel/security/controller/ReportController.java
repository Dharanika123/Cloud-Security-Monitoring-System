package com.sentinel.security.controller;

import com.sentinel.security.model.Report;
import com.sentinel.security.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @PostMapping("/generate")
    public ResponseEntity<Report> generateReport(@RequestParam String type, Authentication authentication) {
        String email = (authentication != null && authentication.isAuthenticated()) ? authentication.getName() : "admin@sentinel.com";
        return ResponseEntity.ok(reportService.generateReport(type, email));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadReportPdf(@PathVariable UUID id) {
        try {
            byte[] pdfBytes = reportService.exportReportPdf(id);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=SentinelCore_Report_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}