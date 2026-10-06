package com.sentinel.security.repo;

import com.sentinel.security.model.ComplianceCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplianceCheckRepository extends JpaRepository<ComplianceCheck, Long> {
    Optional<ComplianceCheck> findByFramework(String framework);
}