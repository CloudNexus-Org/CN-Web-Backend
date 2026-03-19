package com.cloudnexus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class JobRequest {

    @NotBlank(message = "Job title is required")
    private String title;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Employment type is required")
    private String employmentType;

    private String salaryRange;

    @NotBlank(message = "Description is required")
    private String description;

    private List<String> responsibilities;
    private List<String> requirements;
    
    private String status = "Active";
}
