package com.petlifelog.backend.domain.map;

import com.petlifelog.backend.domain.map.dto.MapMarkerResponse;
import com.petlifelog.backend.domain.map.dto.MapMemoryResponse;
import com.petlifelog.backend.domain.memory.Memory;
import com.petlifelog.backend.domain.memory.Photo;
import com.petlifelog.backend.domain.memory.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
                .map(this::toMemoryResponse)
                .toList();
    }

    public List<MapMarkerResponse> getMapMarkers(
            UUID userId,
            double swLat, double neLat,
            double swLng, double neLng,
            UUID petId) {

        return photoRepository.findMapMarkers(userId, swLat, neLat, swLng, neLng, petId)
                .stream().map(this::toMarkerResponse).toList();
    }

    public MapMemoryResponse getMemoryDetail(UUID userId, UUID memoryId) {
        Photo photo = photoRepository.findFirstByMemory_IdAndGpsLatIsNotNull(memoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (!photo.getMemory().getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return toMemoryResponse(photo);
    }

    private MapMarkerResponse toMarkerResponse(Photo photo) {
        Memory memory = photo.getMemory();
        String thumb = photo.getPathThumb100() != null ? photo.getPathThumb100()
                : photo.getPathThumb300() != null ? photo.getPathThumb300()
                : photo.getPathOrigin();

        return MapMarkerResponse.builder()
                .id(photo.getId())
                .lat(photo.getGpsLat())
                .lng(photo.getGpsLng())
                .thumb(thumb)
                .momentId(memory.getId())
                .dateKey(memory.getMemoryDate())
                .build();
    }

    private MapMemoryResponse toMemoryResponse(Photo photo) {
        Memory memory = photo.getMemory();

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
