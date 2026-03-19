package com.cloudnexus.backend.service;

import com.cloudnexus.backend.dto.DashboardStatsResponse;
import com.cloudnexus.backend.model.Applicant;
import com.cloudnexus.backend.repository.ApplicantRepository;
import com.cloudnexus.backend.repository.BlogPostRepository;
import com.cloudnexus.backend.repository.JobRepository;
import com.cloudnexus.backend.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JobRepository jobRepository;
    private final ApplicantRepository applicantRepository;
    private final LeadRepository leadRepository;
    private final BlogPostRepository blogPostRepository;

    public DashboardStatsResponse getDashboardStats() {
        long totalJobs = jobRepository.count();
        long totalApplicants = applicantRepository.count();
        long totalLeads = leadRepository.count();
        long totalBlogPosts = blogPostRepository.count();

        // Get recent applications (last 6)
        List<Applicant> recentApplications = applicantRepository.findAll(
                PageRequest.of(0, 6, Sort.by(Sort.Direction.DESC, "appliedAt"))
        ).getContent();

        // Get applications per month for the last 12 months (simplified)
        Map<String, Long> applicationsPerMonth = getApplicationsPerMonth();

        return DashboardStatsResponse.builder()
                .totalJobs(totalJobs)
                .totalApplicants(totalApplicants)
                .totalLeads(totalLeads)
                .totalBlogPosts(totalBlogPosts)
                .recentApplications(recentApplications)
                .applicationsPerMonth(applicationsPerMonth)
                .build();
    }

    private Map<String, Long> getApplicationsPerMonth() {
        List<Applicant> allApplicants = applicantRepository.findAll();
        
        // Group by month name (e.g., "Jan", "Feb")
        Map<String, Long> monthlyCounts = allApplicants.stream()
                .filter(a -> a.getAppliedAt() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getAppliedAt().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                        LinkedHashMap::new,
                        Collectors.counting()
                ));

        // Ensure all months are represented if needed, but for now just return what we have
        return monthlyCounts;
    }
}
