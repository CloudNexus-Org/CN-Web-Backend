package com.cloudnexus.backend.service;

import com.cloudnexus.backend.config.ResourceNotFoundException;
import com.cloudnexus.backend.dto.LeadRequest;
import com.cloudnexus.backend.model.Lead;
import com.cloudnexus.backend.repository.LeadRepository;
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
class LeadServiceTest {

    @Mock
    private LeadRepository leadRepository;

    @InjectMocks
    private LeadService leadService;

    private Lead lead;
    private LeadRequest leadRequest;

    @BeforeEach
    void setUp() {
        lead = Lead.builder()
                .id(1L)
                .companyName("Acme Corp")
                .contactPerson("John Doe")
                .email("john@acme.com")
                .phone("1234567890")
                .subject("Partnership")
                .status("New")
                .build();

        leadRequest = new LeadRequest();
        leadRequest.setCompanyName("Acme Corp");
        leadRequest.setContactPerson("John Doe");
        leadRequest.setEmail("john@acme.com");
        leadRequest.setPhone("1234567890");
        leadRequest.setSubject("Partnership");
        leadRequest.setStatus("New");
    }

    @Test
    void getAllLeads_returnsAll() {
        when(leadRepository.findAll()).thenReturn(List.of(lead));
        assertThat(leadService.getAllLeads()).hasSize(1);
    }

    @Test
    void getLeadById_found_returnsLead() {
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        assertThat(leadService.getLeadById(1L).getCompanyName()).isEqualTo("Acme Corp");
    }

    @Test
    void getLeadById_notFound_throwsException() {
        when(leadRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> leadService.getLeadById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createLead_savesAndReturns() {
        when(leadRepository.save(any(Lead.class))).thenReturn(lead);
        Lead result = leadService.createLead(leadRequest);
        assertThat(result.getCompanyName()).isEqualTo("Acme Corp");
        verify(leadRepository).save(any(Lead.class));
    }

    @Test
    void createLead_nullStatus_defaultsToNew() {
        leadRequest.setStatus(null);
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        Lead result = leadService.createLead(leadRequest);
        assertThat(result.getStatus()).isEqualTo("New");
    }

    @Test
    void updateLead_updatesFields() {
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        leadRequest.setCompanyName("New Corp");
        Lead result = leadService.updateLead(1L, leadRequest);
        assertThat(result.getCompanyName()).isEqualTo("New Corp");
    }

    @Test
    void updateLead_nullStatus_doesNotChangeStatus() {
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        leadRequest.setStatus(null);
        Lead result = leadService.updateLead(1L, leadRequest);
        assertThat(result.getStatus()).isEqualTo("New");
    }

    @Test
    void updateLeadStatus_updatesStatus() {
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(any(Lead.class))).thenAnswer(inv -> inv.getArgument(0));
        Lead result = leadService.updateLeadStatus(1L, "Qualified");
        assertThat(result.getStatus()).isEqualTo("Qualified");
    }

    @Test
    void deleteLead_deletesSuccessfully() {
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        leadService.deleteLead(1L);
        verify(leadRepository).delete(lead);
    }

    @Test
    void deleteLead_notFound_throwsException() {
        when(leadRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> leadService.deleteLead(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
