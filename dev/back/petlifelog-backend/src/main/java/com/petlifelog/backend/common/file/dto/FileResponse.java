package com.petlifelog.backend.common.file.dto;

import com.petlifelog.backend.common.file.domain.AttachedFile;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class FileResponse {

    private UUID id;
    private String originalName;
    private String fileUrl;       // 프론트에서 바로 사용 가능한 접근 URL
    private String contentType;
    private Long fileSize;
    private Integer sortOrder;
    private Instant createdAt;

    public static FileResponse from(AttachedFile file, String fileBaseUrl) {
        return FileResponse.builder()
                .id(file.getId())
                .originalName(file.getOriginalName())
                .fileUrl(fileBaseUrl + "/" + file.getStoredPath())
                .contentType(file.getContentType())
                .fileSize(file.getFileSize())
                .sortOrder(file.getSortOrder())
                .createdAt(file.getCreatedAt())
                .build();
    }
}
