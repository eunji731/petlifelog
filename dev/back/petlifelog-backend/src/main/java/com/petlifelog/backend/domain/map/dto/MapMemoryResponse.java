package com.petlifelog.backend.domain.map.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class MapMemoryResponse {

    private UUID photoId;
    private String path;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime takenAt;

    private Double latitude;
    private Double longitude;

    private MemoryInfo moment;
    private DailyLogInfo dailyLog;

    @Getter
    @Builder
    public static class MemoryInfo {
        private UUID id;
        private String aiTitle;
        private String category;
        private String locationName;
        private String aiDiary;
    }

    @Getter
    @Builder
    public static class DailyLogInfo {
        private UUID id;

        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate dateKey;

        private String aiTitle;
    }
}
