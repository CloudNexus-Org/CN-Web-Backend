package com.cloudnexus.backend.service;

import com.cloudnexus.backend.config.ResourceNotFoundException;
import com.cloudnexus.backend.dto.JobRequest;
import com.cloudnexus.backend.model.Job;
import com.cloudnexus.backend.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<Job> getActiveJobs() {
        return jobRepository.findByStatus("Active");
    }

    public Job getJobById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + id));
    }

    public Job createJob(JobRequest jobRequest) {
        Job job = Job.builder()
                .title(jobRequest.getTitle())
                .category(jobRequest.getCategory())
                .location(jobRequest.getLocation())
                .employmentType(jobRequest.getEmploymentType())
                .salaryRange(jobRequest.getSalaryRange())
                .description(jobRequest.getDescription())
                .responsibilities(jobRequest.getResponsibilities())
                .requirements(jobRequest.getRequirements())
                .status(jobRequest.getStatus() != null ? jobRequest.getStatus() : "Active")
                .build();
        return jobRepository.save(job);
    }

    public Job updateJob(Long id, JobRequest jobRequest) {
        Job job = getJobById(id);
        
        job.setTitle(jobRequest.getTitle());
        job.setCategory(jobRequest.getCategory());
        job.setLocation(jobRequest.getLocation());
        job.setEmploymentType(jobRequest.getEmploymentType());
        job.setSalaryRange(jobRequest.getSalaryRange());
        job.setDescription(jobRequest.getDescription());
        job.setResponsibilities(jobRequest.getResponsibilities());
        job.setRequirements(jobRequest.getRequirements());
        if (jobRequest.getStatus() != null) {
            job.setStatus(jobRequest.getStatus());
        }

        return jobRepository.save(job);
    }

    public void deleteJob(Long id) {
        Job job = getJobById(id);
        jobRepository.delete(job);
    }
}
