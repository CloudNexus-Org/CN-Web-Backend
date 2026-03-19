package com.cloudnexus.backend.service;

import com.cloudnexus.backend.config.ResourceNotFoundException;
import com.cloudnexus.backend.dto.ApplicantRequest;
import com.cloudnexus.backend.model.Applicant;
import com.cloudnexus.backend.model.Job;
import com.cloudnexus.backend.repository.ApplicantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicantService {

    private final ApplicantRepository applicantRepository;
    private final JobService jobService;

    public List<Applicant> getAllApplicants() {
        return applicantRepository.findAll();
    }

    public List<Applicant> getApplicantsByJob(Long jobId) {
        return applicantRepository.findByJobId(jobId);
    }

    public Applicant getApplicantById(Long id) {
        return applicantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant not found with id: " + id));
    }

    public Applicant applyForJob(ApplicantRequest request) {
        Job job = jobService.getJobById(request.getJobId());

        Applicant applicant = Applicant.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .resumeUrl(request.getResumeUrl())
                .linkedinProfile(request.getLinkedinProfile())
                .portfolioUrl(request.getPortfolioUrl())
                .coverLetter(request.getCoverLetter())
                .status("New")
                .job(job)
                .build();

        return applicantRepository.save(applicant);
    }

    public Applicant updateApplicantStatus(Long id, String status) {
        Applicant applicant = getApplicantById(id);
        applicant.setStatus(status);
        return applicantRepository.save(applicant);
    }

    public void deleteApplicant(Long id) {
        if (!applicantRepository.existsById(id)) {
            throw new ResourceNotFoundException("Applicant not found with id: " + id);
        }
        applicantRepository.deleteById(id);
    }
}
