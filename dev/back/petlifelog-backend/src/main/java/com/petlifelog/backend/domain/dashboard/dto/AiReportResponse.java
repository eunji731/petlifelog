package com.petlifelog.backend.domain.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AiReportResponse {

    private String reportYearMonth;
    private LocalDateTime generatedAt;
    private boolean hasData;

    private MonthlyReportSection monthlyReport;
    private PersonalityInsightSection personalityInsight;
    private ActivityInsightSection activityInsight;
    private LocationInsightSection locationInsight;
    private String guardianMessage;
    private String nextSuggestion;

    @Getter
    @Builder
    public static class MonthlyReportSection {
        private String headline;
        private String narrative;
        private List<HighlightItem> highlights;
        private List<String> tags;
    }

    @Getter
    @Builder
    public static class HighlightItem {
        private String title;
        private String date;
        private String reason;
    }

    @Getter
    @Builder
    public static class PersonalityInsightSection {
        private String type;    // NATURE_LOVER | SOCIAL | HOMEBODY | ADVENTURER | ROUTINE_KEEPER
        private String label;
        private String message;
    }

    @Getter
    @Builder
    public static class ActivityInsightSection {
        private Double averageEnergy;
        private Double recentAverage;
        private Double previousAverage;
        private Double diff;
        private String trend;       // UP | STABLE | DOWN | UNKNOWN
        private String level;       // GREAT | NORMAL | WATCH | WARNING | UNKNOWN
        private String confidence;  // HIGH | LOW | NONE
        private String message;
    }

    @Getter
    @Builder
    public static class LocationInsightSection {
        private String verdict;         // VARIED | FOCUSED | ROUTINE | LOW_DATA
        private Integer placeRecordCount;
        private Integer uniquePlaceCount;
        private String topPlace;
        private String message;
    }
}
