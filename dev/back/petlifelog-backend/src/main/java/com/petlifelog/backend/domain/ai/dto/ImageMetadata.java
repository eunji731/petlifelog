package com.petlifelog.backend.domain.ai.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ImageMetadata {
    private String fileName;
    private LocalDateTime takenAt;
    private Double latitude;
    private Double longitude;
}
