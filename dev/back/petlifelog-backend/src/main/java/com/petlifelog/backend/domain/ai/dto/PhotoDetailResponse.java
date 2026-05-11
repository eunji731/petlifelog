package com.petlifelog.backend.domain.ai.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PhotoDetailResponse {
    private String fileName;
    private List<String> themeTags;
    private String photoComment;
    private Integer vibeScore;
    private Boolean isBest;
}
