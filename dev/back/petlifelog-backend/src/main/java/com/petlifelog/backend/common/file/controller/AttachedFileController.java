package com.petlifelog.backend.common.file.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.dto.FileResponse;
import com.petlifelog.backend.common.file.dto.FileSyncRequest;
import com.petlifelog.backend.common.file.service.AttachedFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * 독립형 파일 동기화 API.
 *
 * 부모 엔티티 저장과 파일 저장이 별도의 요청으로 분리되는 경우에 사용한다.
 * 부모 엔티티 API에서 직접 AttachedFileService 를 호출하는 방식(통합형)이 일반적이며,
 * 해당 방식의 예시는 하단 주석을 참고한다.
 *
 * ─── 엔드포인트 ──────────────────────────────────────────────
 *  GET  /api/files/{parentType}/{parentId}
 *       → 부모에 첨부된 파일 목록 조회
 *
 *  POST /api/files/{parentType}/{parentId}/sync
 *       → 신규 등록 시 파일 일괄 업로드
 *       → Request : multipart/form-data
 *                   files (MultipartFile[])
 *
 *  PUT  /api/files/{parentType}/{parentId}/sync
 *       → 수정 시 삭제 + 신규를 한 트랜잭션으로 동기화 (Deferred Sync)
 *       → Request : multipart/form-data
 *                   sync  (JSON: { "deletedFileIds": ["uuid1", "uuid2"] })
 *                   files (MultipartFile[], optional)
 * ─────────────────────────────────────────────────────────────
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class AttachedFileController {

    private final AttachedFileService attachedFileService;

    // ── 파일 목록 조회 ──────────────────────────────────────────

    @GetMapping("/{parentType}/{parentId}")
    public ResponseEntity<ApiResponse<List<FileResponse>>> getFiles(
            @PathVariable ParentDomainType parentType,
            @PathVariable UUID parentId) {

        List<FileResponse> files = attachedFileService.getFiles(parentType, parentId);
        return ResponseEntity.ok(ApiResponse.success(files));
    }

    // ── 신규 등록: 최종 선택된 파일 일괄 업로드 ─────────────────

    @PostMapping(value = "/{parentType}/{parentId}/sync",
                 consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<FileResponse>>> uploadFiles(
            @PathVariable ParentDomainType parentType,
            @PathVariable UUID parentId,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {

        List<FileResponse> saved = attachedFileService.saveAll(parentType, parentId, files);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    // ── 단일 파일 교체 (프로필 사진 등) ─────────────────────────
    //  기존 파일 전부 삭제 후 새 파일 1개로 대체한다.

    @PutMapping(value = "/{parentType}/{parentId}/replace",
                consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileResponse>> replaceFile(
            @PathVariable ParentDomainType parentType,
            @PathVariable UUID parentId,
            @RequestPart("file") MultipartFile file) {

        FileResponse result = attachedFileService.replaceSingle(parentType, parentId, file);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── 수정: 삭제 목록 + 신규 파일을 단일 트랜잭션으로 동기화 ──

    @PutMapping(value = "/{parentType}/{parentId}/sync",
                consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<FileResponse>>> syncFiles(
            @PathVariable ParentDomainType parentType,
            @PathVariable UUID parentId,
            @RequestPart("sync") FileSyncRequest syncRequest,
            @RequestPart(value = "files", required = false) List<MultipartFile> newFiles) {

        List<FileResponse> result = attachedFileService.syncFiles(
                parentType, parentId, syncRequest.getDeletedFileIds(), newFiles);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}

/*
 * ══════════════════════════════════════════════════════════════════
 * [통합형 사용 예시 - 부모 엔티티 Controller에서 직접 처리]
 *
 * @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
 * public ResponseEntity<ApiResponse<MemoryResponse>> updateMemory(
 *         @PathVariable UUID id,
 *         @RequestPart("data") @Valid MemoryUpdateRequest request,   // deletedFileIds 포함
 *         @RequestPart(value = "files", required = false) List<MultipartFile> newFiles,
 *         @AuthenticationPrincipal UserPrincipal principal) {
 *
 *     MemoryResponse memory = memoryService.update(id, request, principal.getId());
 *
 *     // 파일 동기화 (메모리 저장과 동일 트랜잭션으로 처리하려면
 *     //  memoryService.update() 내부에서 attachedFileService.syncFiles() 를 호출한다)
 *     attachedFileService.syncFiles(ParentDomainType.MEMORY, id,
 *                                   request.getDeletedFileIds(), newFiles);
 *
 *     return ResponseEntity.ok(ApiResponse.success(memory));
 * }
 * ══════════════════════════════════════════════════════════════════
 */
