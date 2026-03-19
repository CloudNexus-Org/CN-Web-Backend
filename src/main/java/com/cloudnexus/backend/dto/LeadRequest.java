package com.cloudnexus.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LeadRequest {

    private String companyName;

    private String subject;

    @NotBlank(message = "Contact person is required")
    private String contactPerson;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String status = "New";
    private String estimatedValue;

    @NotBlank(message = "Lead source is required")
    private String source;

    private String notes;
}
