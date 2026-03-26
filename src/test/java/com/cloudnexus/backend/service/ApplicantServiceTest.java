package com.cloudnexus.backend.service;

import com.cloudnexus.backend.config.ResourceNotFoundException;
import com.cloudnexus.backend.dto.ApplicantRequest;
import com.cloudnexus.backend.model.Applicant;
import com.cloudnexus.backend.model.Job;
import com.cloudnexus.backend.repository.ApplicantRepository;
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
class ApplicantServiceTest {

    @Mock
    private ApplicantRepository applicantRepository;

    @Mock
    private JobService jobService;

    @InjectMocks
    private ApplicantService applicantService;

    private Applicant applicant;
    private Job job;
    private ApplicantRequest request;

    @BeforeEach
    void setUp() {
        job = Job.builder().id(1L).title("Engineer").status("Active").build();

        applicant = Applicant.builder()
                .id(1L)
                .firstName("Jane")
                .lastName("Doe")
                .email("jane@example.com")
                .phone("9876543210")
                .status("New")
                .job(job)
                .build();

        request = new ApplicantRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setEmail("jane@example.com");
        request.setPhone("9876543210");
        request.setJobId(1L);
    }

    @Test
    void getAllApplicants_returnsAll() {
        when(applicantRepository.findAll()).thenReturn(List.of(applicant));
        assertThat(applicantService.getAllApplicants()).hasSize(1);
    }

    @Test
    void getApplicantsByJob_returnsForJob() {
        when(applicantRepository.findByJobId(1L)).thenReturn(List.of(applicant));
        assertThat(applicantService.getApplicantsByJob(1L)).hasSize(1);
    }

    @Test
    void getApplicantById_found_returnsApplicant() {
        when(applicantRepository.findById(1L)).thenReturn(Optional.of(applicant));
        assertThat(applicantService.getApplicantById(1L).getEmail()).isEqualTo("jane@example.com");
    }

    @Test
    void getApplicantById_notFound_throwsException() {
        when(applicantRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> applicantService.getApplicantById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void applyForJob_savesApplicant() {
        when(jobService.getJobById(1L)).thenReturn(job);
        when(applicantRepository.save(any(Applicant.class))).thenReturn(applicant);
        Applicant result = applicantService.applyForJob(request);
        assertThat(result.getFirstName()).isEqualTo("Jane");
        verify(applicantRepository).save(any(Applicant.class));
    }

    @Test
    void applyForJob_setsStatusToNew() {
        when(jobService.getJobById(1L)).thenReturn(job);
        when(applicantRepository.save(any(Applicant.class))).thenAnswer(inv -> inv.getArgument(0));
        Applicant result = applicantService.applyForJob(request);
        assertThat(result.getStatus()).isEqualTo("New");
    }

    @Test
    void updateApplicantStatus_updatesStatus() {
        when(applicantRepository.findById(1L)).thenReturn(Optional.of(applicant));
        when(applicantRepository.save(any(Applicant.class))).thenAnswer(inv -> inv.getArgument(0));
        Applicant result = applicantService.updateApplicantStatus(1L, "Hired");
        assertThat(result.getStatus()).isEqualTo("Hired");
    }

    @Test
    void deleteApplicant_deletesSuccessfully() {
        when(applicantRepository.existsById(1L)).thenReturn(true);
        applicantService.deleteApplicant(1L);
        verify(applicantRepository).deleteById(1L);
    }

    @Test
    void deleteApplicant_notFound_throwsException() {
        when(applicantRepository.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> applicantService.deleteApplicant(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
