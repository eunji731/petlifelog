package com.petlifelog.backend.domain.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public interface AiDiaryUsageRepository extends JpaRepository<AiDiaryUsage, UUID> {

    /** 특정 날짜 + 타입별 AI 호출 횟수 */
    long countByMember_IdAndUsageTypeAndTargetDate(UUID memberId, String usageType, LocalDate targetDate);

    /** 하루 타입별 AI 호출 횟수 */
    long countByMember_IdAndUsageTypeAndCalledAtBetween(UUID memberId, String usageType, LocalDateTime start, LocalDateTime end);
}
