package com.petlifelog.backend.domain.ai.repository;

import com.petlifelog.backend.domain.ai.domain.AiDiaryUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public interface AiDiaryUsageRepository extends JpaRepository<AiDiaryUsage, UUID> {

    long countByMember_IdAndUsageTypeAndTargetDate(UUID memberId, String usageType, LocalDate targetDate);

    long countByMember_IdAndUsageTypeAndCalledAtBetween(UUID memberId, String usageType, LocalDateTime start, LocalDateTime end);
}
