package com.petlifelog.backend.domain.map.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.map.MapService;
import com.petlifelog.backend.domain.map.dto.MapMarkerResponse;
import com.petlifelog.backend.domain.map.dto.MapMemoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/map")
public class MapController {

    private final MapService mapService;

    /** 전체 추억 조회 (상세 데이터 포함) */
    @GetMapping("/memories")
    public ApiResponse<List<MapMemoryResponse>> getMapMemories(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(required = false) Double minLng,
            @RequestParam(required = false) Double maxLng,
            @RequestParam(required = false) UUID petId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ApiResponse.success(mapService.getMapMemories(
                UUID.fromString(user.getUsername()),
                minLat, maxLat, minLng, maxLng,
                petId, startDate, endDate));
    }

    /** 경량 마커 조회 (bbox 기반, 마커 렌더링 전용) */
    @GetMapping("/markers")
    public ApiResponse<List<MapMarkerResponse>> getMapMarkers(
            @AuthenticationPrincipal User user,
            @RequestParam double swLat,
            @RequestParam double neLat,
            @RequestParam double swLng,
            @RequestParam double neLng,
            @RequestParam(required = false) UUID petId,
            @RequestParam(required = false) Integer zoom) {

        return ApiResponse.success(mapService.getMapMarkers(
                UUID.fromString(user.getUsername()),
                swLat, neLat, swLng, neLng, petId));
    }

    /** 마커 클릭 시 단건 상세 조회 */
    @GetMapping("/memories/{memoryId}")
    public ApiResponse<MapMemoryResponse> getMemoryDetail(
            @AuthenticationPrincipal User user,
            @PathVariable UUID memoryId) {

        return ApiResponse.success(mapService.getMemoryDetail(
                UUID.fromString(user.getUsername()), memoryId));
    }
}
