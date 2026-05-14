package com.petlifelog.backend.common.file.service;

import com.petlifelog.backend.common.file.domain.AttachedFile;
import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.dto.FileResponse;
import com.petlifelog.backend.common.file.dto.StoredFileInfo;
import com.petlifelog.backend.common.file.repository.AttachedFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 파일 첨부 비즈니스 로직 서비스.
 *
 * 핵심 메서드:
 *  - saveAll()   : 신규 등록 시 파일 일괄 저장
 *  - syncFiles() : 수정 시 삭제 + 신규 저장을 한 트랜잭션으로 처리 (Deferred Sync)
 *  - deleteAllByParent() : 부모 엔티티 삭제 시 연계 삭제
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttachedFileService {

    private final AttachedFileRepository fileRepository;
    private final FileStorageService storageService;

    // ─────────────────────────────────────────────
    // 조회
    // ─────────────────────────────────────────────

    public List<FileResponse> getFiles(ParentDomainType parentType, UUID parentId) {
        return fileRepository
                .findByParentTypeAndParentIdOrderBySortOrderAsc(parentType, parentId)
                .stream()
                .map(f -> FileResponse.from(f, storageService.getFileUrl(f.getStoredPath())))
                .toList();
    }

    // ─────────────────────────────────────────────
    // 신규 등록: 선택된 파일만 한 번에 저장
    // ─────────────────────────────────────────────

    @Transactional
    public List<FileResponse> saveAll(ParentDomainType parentType, UUID parentId,
                                      List<MultipartFile> files) {
        if (files == null || files.isEmpty()) return List.of();

        List<AttachedFile> saved = new ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            if (file == null || file.isEmpty()) continue;

            String storedPath = storageService.store(file, parentType, parentId);
            saved.add(fileRepository.save(AttachedFile.builder()
                    .parentType(parentType)
                    .parentId(parentId)
                    .originalName(file.getOriginalFilename())
                    .storedPath(storedPath)
                    .contentType(file.getContentType())
                    .fileSize(file.getSize())
                    .sortOrder(i)
                    .build()));
        }

        return saved.stream()
                .map(f -> FileResponse.from(f, storageService.getFileUrl(f.getStoredPath())))
                .toList();
    }

    // ─────────────────────────────────────────────
    // 수정: 삭제 목록 + 신규 파일을 단일 트랜잭션으로 동기화
    //
    // 규칙:
    //  1. deletedFileIds 에 있는 파일만 삭제 (소유권 검증 포함)
    //  2. 새 파일 저장
    //  3. "저장" 버튼을 누르기 전까지 기존 DB/스토리지 변경 없음
    //     → 이 메서드 자체가 Save 버튼 클릭 시 호출되므로 보장됨
    // ─────────────────────────────────────────────

    @Transactional
    public List<FileResponse> syncFiles(ParentDomainType parentType, UUID parentId,
                                        List<UUID> deletedFileIds,
                                        List<MultipartFile> newFiles) {
        // 1단계: 삭제 처리
        if (deletedFileIds != null && !deletedFileIds.isEmpty()) {
            // 해당 부모 소유 파일만 조회 → 다른 부모의 파일 삭제 시도 차단
            List<AttachedFile> toDelete = fileRepository.findByIdInAndParentTypeAndParentId(
                    deletedFileIds, parentType, parentId);

            toDelete.forEach(f -> storageService.delete(f.getStoredPath()));
            fileRepository.deleteAll(toDelete);
            fileRepository.flush(); // 순서 보장을 위해 flush
        }

        // 2단계: 신규 파일 저장
        if (newFiles != null && !newFiles.isEmpty()) {
            int baseOrder = calcNextSortOrder(parentType, parentId);
            for (int i = 0; i < newFiles.size(); i++) {
                MultipartFile file = newFiles.get(i);
                if (file == null || file.isEmpty()) continue;

                String storedPath = storageService.store(file, parentType, parentId);
                fileRepository.save(AttachedFile.builder()
                        .parentType(parentType)
                        .parentId(parentId)
                        .originalName(file.getOriginalFilename())
                        .storedPath(storedPath)
                        .contentType(file.getContentType())
                        .fileSize(file.getSize())
                        .sortOrder(baseOrder + i)
                        .build());
            }
        }

        // 3단계: 최종 상태 반환
        return fileRepository
                .findByParentTypeAndParentIdOrderBySortOrderAsc(parentType, parentId)
                .stream()
                .map(f -> FileResponse.from(f, storageService.getFileUrl(f.getStoredPath())))
                .toList();
    }

    // ─────────────────────────────────────────────
    // 부모 엔티티 삭제 시 연계 삭제 (cascade 대신 명시적 처리)
    // ─────────────────────────────────────────────

    @Transactional
    public void deleteAllByParent(ParentDomainType parentType, UUID parentId) {
        List<AttachedFile> files = fileRepository.findByParentTypeAndParentId(parentType, parentId);
        files.forEach(f -> storageService.delete(f.getStoredPath()));
        fileRepository.deleteAll(files);
    }

    // ─────────────────────────────────────────────
    // 이미 디스크에 저장된 파일을 DB에 등록 (AI 분석→저장 2단계 플로우용)
    // analyze 단계에서 FileStorageService.store()로 저장된 파일들을
    // save 단계에서 실제 parentId(Memory UUID)에 연결할 때 사용한다.
    // ─────────────────────────────────────────────

    @Transactional
    public List<AttachedFile> registerExisting(ParentDomainType parentType, UUID parentId,
                                               List<StoredFileInfo> storedFiles) {
        List<AttachedFile> saved = new ArrayList<>();
        for (int i = 0; i < storedFiles.size(); i++) {
            StoredFileInfo info = storedFiles.get(i);
            saved.add(fileRepository.save(AttachedFile.builder()
                    .parentType(parentType)
                    .parentId(parentId)
                    .originalName(info.getOriginalName())
                    .storedPath(info.getStoredPath())
                    .contentType(info.getContentType())
                    .fileSize(info.getFileSize())
                    .sortOrder(i)
                    .build()));
        }
        return saved;
    }

    // ─────────────────────────────────────────────
    // 단일 파일 교체 (프로필 사진 등 1개만 유지해야 하는 케이스)
    // 기존 파일 전부 삭제 후 새 파일 1개 저장
    // ─────────────────────────────────────────────

    @Transactional
    public FileResponse replaceSingle(ParentDomainType parentType, UUID parentId, MultipartFile file) {
        deleteAllByParent(parentType, parentId);
        List<FileResponse> saved = saveAll(parentType, parentId, List.of(file));
        if (saved.isEmpty()) throw new IllegalArgumentException("파일이 비어있습니다.");
        return saved.get(0);
    }

    // ─────────────────────────────────────────────
    // 고아 파일 정리용: 현재 DB에 기록된 모든 storedPath 반환
    // ─────────────────────────────────────────────

    public Set<String> getAllStoredPaths() {
        return fileRepository.findAll().stream()
                .map(AttachedFile::getStoredPath)
                .collect(Collectors.toSet());
    }

    // ─────────────────────────────────────────────

    private int calcNextSortOrder(ParentDomainType parentType, UUID parentId) {
        List<AttachedFile> existing = fileRepository
                .findByParentTypeAndParentIdOrderBySortOrderAsc(parentType, parentId);
        if (existing.isEmpty()) return 0;
        return existing.get(existing.size() - 1).getSortOrder() + 1;
    }
}
