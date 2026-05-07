package com.petlifelog.backend.common.file.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 파일 동기화 요청의 JSON 파트.
 * multipart/form-data 에서 "sync" 파트로 전달된다.
 *
 * 프론트엔드 FormData 예시:
 *   formData.append('sync', JSON.stringify({ deletedFileIds: ['uuid1', 'uuid2'] }));
 *   newFiles.forEach(f => formData.append('files', f));
 */
@Getter
@NoArgsConstructor
public class FileSyncRequest {

    // 이번 저장에서 삭제할 기존 파일 ID 목록
    private List<UUID> deletedFileIds = new ArrayList<>();
}
