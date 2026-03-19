package com.cloudnexus.backend.service;

import com.cloudnexus.backend.config.ResourceNotFoundException;
import com.cloudnexus.backend.dto.LeadRequest;
import com.cloudnexus.backend.model.Lead;
import com.cloudnexus.backend.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;

    public List<Lead> getAllLeads() {
        return leadRepository.findAll();
    }

    public Lead getLeadById(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));
    }

    public Lead createLead(LeadRequest request) {
        Lead lead = Lead.builder()
                .companyName(request.getCompanyName())
                .contactPerson(request.getContactPerson())
                .subject(request.getSubject())
                .email(request.getEmail())
                .phone(request.getPhone())
                .status(request.getStatus() != null ? request.getStatus() : "New")
                .estimatedValue(request.getEstimatedValue())
                .source(request.getSource())
                .notes(request.getNotes())
                .build();
        return leadRepository.save(lead);
    }

    public Lead updateLead(Long id, LeadRequest request) {
        Lead lead = getLeadById(id);

        lead.setCompanyName(request.getCompanyName());
        lead.setContactPerson(request.getContactPerson());
        lead.setSubject(request.getSubject());
        lead.setEmail(request.getEmail());
        lead.setPhone(request.getPhone());
        lead.setEstimatedValue(request.getEstimatedValue());
        lead.setSource(request.getSource());
        lead.setNotes(request.getNotes());
        
        if (request.getStatus() != null) {
            lead.setStatus(request.getStatus());
        }

        return leadRepository.save(lead);
    }

    public Lead updateLeadStatus(Long id, String status) {
        Lead lead = getLeadById(id);
        lead.setStatus(status);
        return leadRepository.save(lead);
    }

    public void deleteLead(Long id) {
        Lead lead = getLeadById(id);
        leadRepository.delete(lead);
    }
}
