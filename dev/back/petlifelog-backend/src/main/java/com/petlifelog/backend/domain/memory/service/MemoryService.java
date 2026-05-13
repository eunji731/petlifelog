package com.petlifelog.backend.domain.memory.service;

import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.service.AttachedFileService;
import com.petlifelog.backend.domain.memory.domain.Memory;
import com.petlifelog.backend.domain.memory.domain.MemoryMoment;
import com.petlifelog.backend.domain.memory.domain.Photo;
import com.petlifelog.backend.domain.memory.dto.MemoryListResponse;
import com.petlifelog.backend.domain.memory.repository.MemoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * [추억(일기) 서비스]
 *
 * 저장된 일기의 조회와 삭제를 담당합니다.
 * 일기 생성은 AiDiaryService.saveDiary()에서 처리됩니다.
 *
 * ▶ Memory 데이터 구조 (JPA 연관관계)
 *   Memory
 *     ├── List<MemoryMoment>  (1:N, sortOrder로 정렬)
 *     │    └── List<Photo>   (1:N, sortOrder로 정렬)
 *     ├── List<Photo>        (1:N, Memory 직접 연결 사진)
 *     └── List<MemoryDog>    (1:N, 연결된 반려동물)
 *
 * ▶ 삭제 정책
 *   하드 삭제 + 첨부 파일 물리 삭제 (복구 불가)
 *   cascade 설정으로 연관 엔티티(Moment, Photo, MemoryDog 등) 함께 삭제됩니다.
 */
@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class MemoryService {

    private final MemoryRepository memoryRepository;
    private final AttachedFileService attachedFileService;

    /**
     * 사용자의 일기 목록을 반환합니다.
     * 날짜 범위 파라미터가 있으면 해당 기간만, 없으면 전체를 날짜 내림차순으로 반환합니다.
     */
    public List<MemoryListResponse> getMemories(UUID userId, LocalDate startDate, LocalDate endDate) {
        List<Memory> memories = (startDate != null && endDate != null)
                ? memoryRepository.findByUser_IdAndMemoryDateBetweenOrderByMemoryDateDesc(userId, startDate, endDate)
                : memoryRepository.findByUser_IdOrderByMemoryDateDesc(userId);
        return memories.stream().map(this::toResponse).toList();
    }

    /**
     * 일기를 삭제합니다.
     *
     * 1. 본인 소유 확인 (타인 일기 삭제 차단)
     * 2. AttachedFile 및 물리 파일 삭제
     * 3. Memory 엔티티 삭제 (cascade로 Moment, Photo, MemoryDog 등 함께 삭제)
     */
    @Transactional
    public void deleteMemory(UUID userId, UUID memoryId) {
        Memory memory = memoryRepository.findById(memoryId)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));

        // 본인 소유 검증 - 타인의 일기를 삭제하려는 시도 차단
        if (!memory.getUser().getId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

        // 연결된 파일 먼저 삭제 (물리 파일 + AttachedFile 레코드)
        attachedFileService.deleteAllByParent(ParentDomainType.MEMORY, memoryId);
        memoryRepository.delete(memory);
    }

    /**
     * Memory 엔티티 → MemoryListResponse DTO 변환.
     * 모멘트와 사진은 sortOrder 기준으로 정렬하여 원래 순서 보장합니다.
     */
    private MemoryListResponse toResponse(Memory memory) {
        // 대표 사진 경로 (없으면 null)
        String repPath = memory.getRepresentativePhoto() != null
                ? memory.getRepresentativePhoto().getPathOrigin()
                : null;

        // 사진 목록 (sortOrder 기준 정렬)
        List<MemoryListResponse.PhotoInfo> photos = memory.getPhotos().stream()
                .sorted(Comparator.comparingInt(Photo::getSortOrder))
                .map(this::toPhotoInfo)
                .toList();

        // 연결된 반려동물 ID 목록
        List<String> petIds = memory.getMemoryDogs().stream()
                .map(md -> md.getDog().getId().toString())
                .toList();

        // 모멘트 목록 (sortOrder 기준 정렬, 각 모멘트의 사진도 정렬)
        List<MemoryListResponse.MomentInfo> moments = memory.getMoments().stream()
                .sorted(Comparator.comparingInt(MemoryMoment::getSortOrder))
                .map(m -> MemoryListResponse.MomentInfo.builder()
                        .id(m.getId().toString())
                        .category(m.getCategory())
                        .aiTitle(m.getAiTitle())
                        .aiContent(m.getAiContent())
                        .locationName(m.getLocationName())
                        .energyLevel(m.getEnergyLevel())
                        .tags(m.getTags())
                        .representativePhotoPath(m.getRepresentativePhotoPath())
                        .photos(m.getPhotos().stream()
                                .sorted(Comparator.comparingInt(Photo::getSortOrder))
                                .map(this::toPhotoInfo)
                                .toList())
                        .build())
                .toList();

        return MemoryListResponse.builder()
                .id(memory.getId().toString())
                .dateKey(memory.getMemoryDate().toString())
                .aiTitle(memory.getAiTitle())
                .aiSummary(memory.getSummary())
                .representativePhotoPath(repPath)
                .aiDiary(memory.getAiDiary())
                .locationName(memory.getLocation())
                .energyLevel(memory.getEnergyLevel())
                .photos(photos)
                .petIds(petIds)
                .moments(moments)
                .build();
    }

    /** Photo 엔티티 → PhotoInfo DTO 변환. GPS 좌표도 함께 전달합니다. */
    private MemoryListResponse.PhotoInfo toPhotoInfo(Photo p) {
        return MemoryListResponse.PhotoInfo.builder()
                .id(p.getId().toString())
                .path(p.getPathOrigin())
                .takenAt(p.getTakenAt() != null ? p.getTakenAt().toString() : null)
                .latitude(p.getGpsLat())
                .longitude(p.getGpsLng())
                .build();
    }
}
