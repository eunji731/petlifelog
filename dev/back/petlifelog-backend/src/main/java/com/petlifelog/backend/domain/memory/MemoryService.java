package com.petlifelog.backend.domain.memory;

import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.service.AttachedFileService;
import com.petlifelog.backend.domain.memory.dto.MemoryListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class MemoryService {

    private final MemoryRepository memoryRepository;
    private final AttachedFileService attachedFileService;

    public List<MemoryListResponse> getMemories(UUID userId) {
        return memoryRepository.findByUser_IdOrderByMemoryDateDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteMemory(UUID userId, UUID memoryId) {
        Memory memory = memoryRepository.findById(memoryId)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));

        if (!memory.getUser().getId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

        attachedFileService.deleteAllByParent(ParentDomainType.MEMORY, memoryId);
        memoryRepository.delete(memory);
    }

    private MemoryListResponse toResponse(Memory memory) {
        String repPath = memory.getRepresentativePhoto() != null
                ? memory.getRepresentativePhoto().getPathOrigin()
                : null;

        List<MemoryListResponse.PhotoInfo> photos = memory.getPhotos().stream()
                .sorted(Comparator.comparingInt(Photo::getSortOrder))
                .map(p -> MemoryListResponse.PhotoInfo.builder()
                        .id(p.getId().toString())
                        .path(p.getPathOrigin())
                        .build())
                .toList();

        List<String> petIds = memory.getMemoryDogs().stream()
                .map(md -> md.getDog().getId().toString())
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
                .build();
    }
}
