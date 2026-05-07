package com.petlifelog.backend.domain.ai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class DailyLogResponse {
    private String aiTitle;
    private String aiSummary;
    private String representativePhotoPath;
    private List<MomentResponse> moments;
}
