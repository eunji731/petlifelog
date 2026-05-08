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

    @Getter
    @Builder
    public static class PhotoInfo {
        private String id;
        private String path;
    }
}
