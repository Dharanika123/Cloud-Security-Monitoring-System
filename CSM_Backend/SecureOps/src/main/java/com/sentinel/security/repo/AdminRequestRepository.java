package com.sentinel.security.repo;

import com.sentinel.security.model.AdminRequest;
import com.sentinel.security.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminRequestRepository extends JpaRepository<AdminRequest, Long> {
    List<AdminRequest> findByRequester(User requester);
    List<AdminRequest> findByStatus(AdminRequest.RequestStatus status);
}