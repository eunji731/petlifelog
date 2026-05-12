package com.petlifelog.backend.domain.dashboard.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DashboardSummaryResponse {

    private PetInfo pet;
    private MonthlyStats monthlyStats;
    private List<BestPhotoItem> bestPhotos;
    private List<FavoritePlaceItem> favoritePlaces;
    private StreakInfo streak;

    @Getter
    @Builder
    public static class PetInfo {
        private String id;
        private String name;
        private String breed;
        private String ageLabel;
        private Integer daysTogether;
        private Integer birthdayDday;
        private String profileImagePath;
    }

    @Getter
    @Builder
    public static class MonthlyStats {
        private long recordedDays;
        private long visitedPlaces;
        private long bestPhotosCount;
    }

    @Getter
    @Builder
    public static class BestPhotoItem {
        private String photoPath;
        private String memoryId;
        private String memoryDate;
        private Integer vibeScore;
        private String aiComment;
    }

    @Getter
    @Builder
    public static class FavoritePlaceItem {
        private String locationName;
        private long count;
    }

    @Getter
    @Builder
    public static class StreakInfo {
        private int current;
        private int longest;
    }
}
