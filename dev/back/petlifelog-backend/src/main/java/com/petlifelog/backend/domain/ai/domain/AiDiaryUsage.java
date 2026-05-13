package com.petlifelog.backend.domain.ai.domain;

import com.petlifelog.backend.domain.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "ai_usages", indexes = {
        @Index(name = "idx_ai_usage_member_target", columnList = "member_id, target_date"),
        @Index(name = "idx_ai_usage_member_called", columnList = "member_id, called_at")
})
public class AiDiaryUsage {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "called_at", nullable = false)
    private LocalDateTime calledAt;

    @Column(name = "usage_type", nullable = false, length = 20)
    private String usageType;

    @Builder
    public AiDiaryUsage(Member member, LocalDate targetDate, LocalDateTime calledAt, String usageType) {
        this.member = member;
        this.targetDate = targetDate;
        this.calledAt = calledAt;
        this.usageType = usageType != null ? usageType : "DIARY";
    }
}
