package com.cloudnexus.backend.repository;

import com.cloudnexus.backend.model.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicantRepository extends JpaRepository<Applicant, Long> {
    List<Applicant> findByJobId(Long jobId);
    List<Applicant> findByStatus(String status);
}
