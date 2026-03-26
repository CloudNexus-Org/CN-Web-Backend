package com.cloudnexus.backend.service;

import com.cloudnexus.backend.config.ResourceNotFoundException;
import com.cloudnexus.backend.dto.JobRequest;
import com.cloudnexus.backend.model.Job;
import com.cloudnexus.backend.repository.JobRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @InjectMocks
    private JobService jobService;

    private Job job;
    private JobRequest jobRequest;

    @BeforeEach
    void setUp() {
        job = Job.builder()
                .id(1L)
                .title("Backend Engineer")
                .category("Engineering")
                .location("Remote")
                .employmentType("Full-time")
                .description("Build APIs")
                .status("Active")
                .build();

        jobRequest = new JobRequest();
        jobRequest.setTitle("Backend Engineer");
        jobRequest.setCategory("Engineering");
        jobRequest.setLocation("Remote");
        jobRequest.setEmploymentType("Full-time");
        jobRequest.setDescription("Build APIs");
        jobRequest.setStatus("Active");
    }

    @Test
    void getAllJobs_returnsAllJobs() {
        when(jobRepository.findAll()).thenReturn(List.of(job));
        List<Job> result = jobService.getAllJobs();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Backend Engineer");
    }

    @Test
    void getActiveJobs_returnsActiveOnly() {
        when(jobRepository.findByStatus("Active")).thenReturn(List.of(job));
        List<Job> result = jobService.getActiveJobs();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("Active");
    }

    @Test
    void getJobById_found_returnsJob() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        Job result = jobService.getJobById(1L);
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getJobById_notFound_throwsException() {
        when(jobRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> jobService.getJobById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void createJob_savesAndReturnsJob() {
        when(jobRepository.save(any(Job.class))).thenReturn(job);
        Job result = jobService.createJob(jobRequest);
        assertThat(result.getTitle()).isEqualTo("Backend Engineer");
        verify(jobRepository).save(any(Job.class));
    }

    @Test
    void createJob_nullStatus_defaultsToActive() {
        jobRequest.setStatus(null);
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));
        Job result = jobService.createJob(jobRequest);
        assertThat(result.getStatus()).isEqualTo("Active");
    }

    @Test
    void updateJob_updatesFields() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));
        jobRequest.setTitle("Senior Engineer");
        Job result = jobService.updateJob(1L, jobRequest);
        assertThat(result.getTitle()).isEqualTo("Senior Engineer");
    }

    @Test
    void updateJob_nullStatus_doesNotChangeStatus() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(jobRepository.save(any(Job.class))).thenAnswer(inv -> inv.getArgument(0));
        jobRequest.setStatus(null);
        Job result = jobService.updateJob(1L, jobRequest);
        assertThat(result.getStatus()).isEqualTo("Active");
    }

    @Test
    void deleteJob_deletesSuccessfully() {
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        jobService.deleteJob(1L);
        verify(jobRepository).delete(job);
    }

    @Test
    void deleteJob_notFound_throwsException() {
        when(jobRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> jobService.deleteJob(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
