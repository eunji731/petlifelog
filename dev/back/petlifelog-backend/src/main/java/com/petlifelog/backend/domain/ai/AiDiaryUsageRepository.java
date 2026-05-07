package com.petlifelog.backend.domain.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public interface AiDiaryUsageRepository extends JpaRepository<AiDiaryUsage, UUID> {

    /** 특정 날짜 일기에 대한 AI 호출 횟수 */
    long countByMember_IdAndTargetDate(UUID memberId, LocalDate targetDate);

    /** 오늘 하루 전체 AI 호출 횟수 */
    long countByMember_IdAndCalledAtBetween(UUID memberId, LocalDateTime start, LocalDateTime end);
}
