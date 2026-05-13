package com.petlifelog.backend.domain.dashboard.domain;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import com.petlifelog.backend.domain.member.domain.Member;
import com.petlifelog.backend.domain.pet.domain.Pet;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "dashboard_reports", indexes = {
    @Index(name = "idx_dashboard_reports_user_pet_month", columnList = "user_id, pet_id, report_year_month")
})
public class DashboardReport extends BaseTimeEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id")
    private Pet pet;

    @Column(name = "report_year_month", nullable = false, length = 7)
    private String reportYearMonth;

    @Column(name = "monthly_headline")
    private String monthlyHeadline;

    @Column(name = "monthly_narrative", columnDefinition = "TEXT")
    private String monthlyNarrative;

    @Column(name = "monthly_highlights_json", columnDefinition = "TEXT")
    private String monthlyHighlightsJson;

    @Column(name = "monthly_tags_json", columnDefinition = "TEXT")
    private String monthlyTagsJson;

    @Column(name = "personality_type", length = 30)
    private String personalityType;

    @Column(name = "personality_label", length = 30)
    private String personalityLabel;

    @Column(name = "personality_message", columnDefinition = "TEXT")
    private String personalityMessage;

    @Column(name = "activity_average_energy")
    private Double activityAverageEnergy;

    @Column(name = "activity_recent_avg")
    private Double activityRecentAvg;

    @Column(name = "activity_previous_avg")
    private Double activityPreviousAvg;

    @Column(name = "activity_diff")
    private Double activityDiff;

    @Column(name = "activity_trend", length = 10)
    private String activityTrend;

    @Column(name = "activity_level", length = 10)
    private String activityLevel;

    @Column(name = "activity_confidence", length = 10)
    private String activityConfidence;

    @Column(name = "activity_message", columnDefinition = "TEXT")
    private String activityMessage;

    @Column(name = "location_verdict", length = 20)
    private String locationVerdict;

    @Column(name = "location_place_record_count")
    private Integer locationPlaceRecordCount;

    @Column(name = "location_unique_place_count")
    private Integer locationUniquePlaceCount;

    @Column(name = "location_top_place")
    private String locationTopPlace;

    @Column(name = "location_message", columnDefinition = "TEXT")
    private String locationMessage;

    @Column(name = "guardian_message", columnDefinition = "TEXT")
    private String guardianMessage;

    @Column(name = "next_suggestion", columnDefinition = "TEXT")
    private String nextSuggestion;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Builder
    public DashboardReport(Member user, Pet pet, String reportYearMonth,
                           String monthlyHeadline, String monthlyNarrative,
                           String monthlyHighlightsJson, String monthlyTagsJson,
                           String personalityType, String personalityLabel, String personalityMessage,
                           Double activityAverageEnergy, Double activityRecentAvg, Double activityPreviousAvg,
                           Double activityDiff, String activityTrend, String activityLevel,
                           String activityConfidence, String activityMessage,
                           String locationVerdict, Integer locationPlaceRecordCount,
                           Integer locationUniquePlaceCount, String locationTopPlace, String locationMessage,
                           String guardianMessage, String nextSuggestion) {
        this.user = user;
        this.pet = pet;
        this.reportYearMonth = reportYearMonth;
        this.monthlyHeadline = monthlyHeadline;
        this.monthlyNarrative = monthlyNarrative;
        this.monthlyHighlightsJson = monthlyHighlightsJson;
        this.monthlyTagsJson = monthlyTagsJson;
        this.personalityType = personalityType;
        this.personalityLabel = personalityLabel;
        this.personalityMessage = personalityMessage;
        this.activityAverageEnergy = activityAverageEnergy;
        this.activityRecentAvg = activityRecentAvg;
        this.activityPreviousAvg = activityPreviousAvg;
        this.activityDiff = activityDiff;
        this.activityTrend = activityTrend;
        this.activityLevel = activityLevel;
        this.activityConfidence = activityConfidence;
        this.activityMessage = activityMessage;
        this.locationVerdict = locationVerdict;
        this.locationPlaceRecordCount = locationPlaceRecordCount;
        this.locationUniquePlaceCount = locationUniquePlaceCount;
        this.locationTopPlace = locationTopPlace;
        this.locationMessage = locationMessage;
        this.guardianMessage = guardianMessage;
        this.nextSuggestion = nextSuggestion;
        this.generatedAt = LocalDateTime.now();
    }
}
