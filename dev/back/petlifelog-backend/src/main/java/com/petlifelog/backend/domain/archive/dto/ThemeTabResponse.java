package com.petlifelog.backend.domain.archive.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ThemeTabResponse {
    private String tag;
    private Long count;
    private String representativePhotoUrl;
}
