package com.petlifelog.backend.domain.map;

import com.petlifelog.backend.domain.map.dto.MapMemoryResponse;
import com.petlifelog.backend.domain.memory.Photo;
import com.petlifelog.backend.domain.memory.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MapService {

    private final PhotoRepository photoRepository;

    public List<MapMemoryResponse> getMapMemories(
            UUID userId,
            Double minLat, Double maxLat,
            Double minLng, Double maxLng,
            UUID petId,
            LocalDate startDate, LocalDate endDate) {

        return photoRepository
                .findMapMemories(userId, minLat, maxLat, minLng, maxLng, petId, startDate, endDate)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MapMemoryResponse toResponse(Photo photo) {
        var memory = photo.getMemory();

        return MapMemoryResponse.builder()
                .photoId(photo.getId())
                .path(photo.getPathOrigin())
                .takenAt(photo.getTakenAt())
                .latitude(photo.getGpsLat())
                .longitude(photo.getGpsLng())
                .moment(MapMemoryResponse.MemoryInfo.builder()
                        .id(memory.getId())
                        .aiTitle(memory.getAiTitle())
                        .category(memory.getActivityType())
                        .locationName(memory.getLocation())
                        .aiDiary(memory.getAiDiary())
                        .build())
                .dailyLog(MapMemoryResponse.DailyLogInfo.builder()
                        .id(memory.getId())
                        .dateKey(memory.getMemoryDate())
                        .aiTitle(memory.getAiTitle())
                        .build())
                .build();
    }
}
