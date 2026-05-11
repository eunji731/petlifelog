package com.petlifelog.backend.domain.archive.dto;

import com.petlifelog.backend.domain.memory.Photo;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class ArchivePhotoResponse {
    private UUID photoId;
    private String photoUrl;
    private LocalDate memoryDate;
    private String memoryTitle;
    private UUID memoryId;
    private Boolean isBest;
    private Integer vibeScore;
    private String aiComment;
    private List<String> themeTags;

    public static ArchivePhotoResponse from(Photo photo, List<String> themeTags) {
        return ArchivePhotoResponse.builder()
                .photoId(photo.getId())
                .photoUrl(photo.getPathOrigin())
                .memoryDate(photo.getMemory().getMemoryDate())
                .memoryTitle(photo.getMemory().getAiTitle())
                .memoryId(photo.getMemory().getId())
                .isBest(photo.getIsBest())
                .vibeScore(photo.getVibeScore())
                .aiComment(photo.getAiComment())
                .themeTags(themeTags)
                .build();
    }
}
