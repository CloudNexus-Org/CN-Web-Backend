package com.cloudnexus.backend.controller;

import com.cloudnexus.backend.dto.ApplicantRequest;
import com.cloudnexus.backend.model.Applicant;
import com.cloudnexus.backend.service.ApplicantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applicants")
@RequiredArgsConstructor
public class ApplicantController {

    private final ApplicantService applicantService;

    @GetMapping
    public ResponseEntity<List<Applicant>> getAllApplicants() {
        return ResponseEntity.ok(applicantService.getAllApplicants());
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<Applicant>> getApplicantsByJob(@PathVariable Long jobId) {
        return ResponseEntity.ok(applicantService.getApplicantsByJob(jobId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Applicant> getApplicantById(@PathVariable Long id) {
        return ResponseEntity.ok(applicantService.getApplicantById(id));
    }

    @PostMapping
    public ResponseEntity<Applicant> applyForJob(@Valid @RequestBody ApplicantRequest request) {
        Applicant applicant = applicantService.applyForJob(request);
        return new ResponseEntity<>(applicant, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Applicant> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(applicantService.updateApplicantStatus(id, status));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplicant(@PathVariable Long id) {
        applicantService.deleteApplicant(id);
        return ResponseEntity.noContent().build();
    }
}
