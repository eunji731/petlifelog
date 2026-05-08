package com.petlifelog.backend.domain.ai.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CheckMetadataResponse {
    private String originalName;
    private boolean hasDate;
    private boolean hasGps;
}
