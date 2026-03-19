package com.cloudnexus.backend.dto;

import com.cloudnexus.backend.model.Applicant;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class DashboardStatsResponse {
    private long totalJobs;
    private long totalApplicants;
    private long totalLeads;
    private long totalBlogPosts;
    private Map<String, Long> applicationsPerMonth;
    private List<Applicant> recentApplications;
}
