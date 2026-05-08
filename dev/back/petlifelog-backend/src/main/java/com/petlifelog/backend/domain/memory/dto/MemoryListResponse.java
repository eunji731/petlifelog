package com.petlifelog.backend.domain.memory.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MemoryListResponse {

    private String id;
    private String dateKey;
    private String aiTitle;
    private String aiSummary;
    private String representativePhotoPath;
    private String aiDiary;
    private String locationName;
    private Integer energyLevel;
    private List<PhotoInfo> photos;
    private List<String> petIds;
    private List<MomentInfo> moments;

    @Getter
    @Builder
    public static class PhotoInfo {
        private String id;
        private String path;
    }

    @Getter
    @Builder
    public static class MomentInfo {
        private String id;
        private String category;
        private String aiTitle;
        private String aiContent;
        private String locationName;
        private Integer energyLevel;
        private String tags;
        private String representativePhotoPath;
        private List<PhotoInfo> photos;
    }
}
