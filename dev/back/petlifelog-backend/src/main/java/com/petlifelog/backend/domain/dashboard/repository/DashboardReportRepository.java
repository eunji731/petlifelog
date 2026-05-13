package com.petlifelog.backend.domain.dashboard.repository;

import com.petlifelog.backend.domain.dashboard.domain.DashboardReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DashboardReportRepository extends JpaRepository<DashboardReport, UUID> {

    Optional<DashboardReport> findByUser_IdAndPet_IdAndReportYearMonth(
            UUID userId, UUID petId, String reportYearMonth);

    Optional<DashboardReport> findByUser_IdAndPetIsNullAndReportYearMonth(
            UUID userId, String reportYearMonth);
}
