package com.petlifelog.backend.common.file.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 이미 디스크에 저장된 파일의 정보.
 * AI 분석(analyze) 단계에서 저장된 파일을 최종 저장(save) 단계로 전달할 때 사용한다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoredFileInfo {

    private String originalName;
    private String storedPath;    // FileStorageService 가 반환한 상대 경로
    private String fileUrl;       // 미리보기용 접근 가능한 URL (로컬: /files/..., S3: https://...)
    private String contentType;
    private Long fileSize;

    // 사진 EXIF 메타데이터 (일반 파일이면 null)
    private LocalDateTime takenAt;
    private Double latitude;
    private Double longitude;
}
