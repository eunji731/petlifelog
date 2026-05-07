package com.petlifelog.backend.domain.ai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class MomentResponse {
    private String category;
    private String aiTitle;
    private String aiContent;
    private Integer energyLevel;
    private String locationName;
    private List<String> tags;
    private List<String> targetPetIds;

    /** 이 모멘트에 속하는 사진 파일명 목록 (AI가 직접 배정) */
    private List<String> photoFileNames = new ArrayList<>();

    /** 이 모멘트를 대표하는 사진 파일명 (photoFileNames 중 1개) */
    private String representativePhotoPath;
}
