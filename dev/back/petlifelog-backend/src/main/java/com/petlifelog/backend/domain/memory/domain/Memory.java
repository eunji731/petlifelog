package com.petlifelog.backend.domain.memory.domain;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import com.petlifelog.backend.domain.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * [추억(일기) 엔티티]
 *
 * 반려동물의 하루 일기 헤더입니다. 실제 내용은 MemoryMoment에, 사진은 Photo에 저장됩니다.
 * AiDiaryService.saveDiary()에서 생성되며, AI가 분석한 결과가 저장됩니다.
 *
 * ▶ 연관관계
 *   Memory (1) → MemoryMoment (N): 하루 일기 안의 여러 장면
 *   Memory (1) → Photo (N): 일기에 첨부된 모든 사진
 *   Memory (1) → MemoryDog (N): 이 일기에 등장한 반려동물들
 *   Memory (1) → Photo (representativePhoto): 대표 사진 1장
 *
 * ▶ cascade = ALL + orphanRemoval = true
 *   Memory가 삭제되면 연관된 Moment, Photo, MemoryDog도 자동으로 삭제됩니다.
 *
 * ▶ aiStatus 값
 *   - PENDING: AI 분석 대기 중 (현재는 저장 시점에 DONE으로 바로 설정)
 *   - DONE: 저장 완료
 *   - FAILED: AI 분석 실패
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "memories")
public class Memory extends BaseTimeEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    // 이 일기를 작성한 사용자 (지연 로딩: 실제 조회 시점에 DB 접근)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    // 일기 날짜 (사진 EXIF에서 추출하거나 사용자가 직접 선택)
    @Column(name = "memory_date", nullable = false)
    private LocalDate memoryDate;

    // AI가 생성한 하루 전체 요약 (2~3문장)
    private String summary;

    @Column(name = "activity_type")
    private String activityType;

    private String weather;

    // 평균 활동 에너지 (1~5, AI가 사진 분석으로 추정)
    @Column(name = "energy_level")
    private Integer energyLevel;

    // 주요 방문 장소명 (모멘트들의 장소를 종합)
    private String location;

    @Column(name = "user_memo")
    private String userMemo;

    // AI가 생성한 일기 제목
    @Column(name = "ai_title")
    private String aiTitle;

    // 모멘트 내용을 합친 전체 일기 텍스트 (대시보드 리포트 분석에 활용)
    @Column(name = "ai_diary", columnDefinition = "TEXT")
    private String aiDiary;

    // AI 분석 호출 횟수 (미래 재분석 기능 대비)
    @Column(name = "ai_generate_count", nullable = false)
    private Integer aiGenerateCount = 0;

    // AI 분석 상태: PENDING | DONE | FAILED
    @Column(name = "ai_status", nullable = false)
    private String aiStatus = "PENDING";

    // 대표 사진 (AI가 추천하거나 첫 번째 사진으로 선택)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "representative_photo_id")
    private Photo representativePhoto;

    // 일기에 포함된 모든 사진 (cascade: Memory 삭제 시 Photo도 삭제)
    @OneToMany(mappedBy = "memory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos = new ArrayList<>();

    // 시간대별 활동 모멘트 목록 (cascade: Memory 삭제 시 Moment도 삭제)
    @OneToMany(mappedBy = "memory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MemoryMoment> moments = new ArrayList<>();

    // 이 일기에 등장한 반려동물 연결 (cascade: Memory 삭제 시 연결도 삭제)
    @OneToMany(mappedBy = "memory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MemoryDog> memoryDogs = new ArrayList<>();

    @Builder
    public Memory(Member user, LocalDate memoryDate, String summary, String aiTitle, String aiDiary, String aiStatus) {
        this.user = user;
        this.memoryDate = memoryDate;
        this.summary = summary;
        this.aiTitle = aiTitle;
        this.aiDiary = aiDiary;
        this.aiStatus = aiStatus != null ? aiStatus : "PENDING";
        this.aiGenerateCount = 1;
    }

    /** 대표 사진 설정 (AI 추천 사진 또는 첫 번째 사진) */
    public void setRepresentativePhoto(Photo photo) {
        this.representativePhoto = photo;
    }
}
