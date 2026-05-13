package com.petlifelog.backend.domain.map.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.map.service.MapService;
import com.petlifelog.backend.domain.map.dto.MapMarkerResponse;
import com.petlifelog.backend.domain.map.dto.MapMemoryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * [지도 컨트롤러]
 *
 * 사진의 GPS(EXIF) 정보를 기반으로 추억을 지도에 표시합니다.
 * Naver Maps와 연동되며, bbox(Bounding Box) 기반으로 현재 지도 화면에 보이는
 * 마커만 로드하여 성능을 최적화합니다.
 *
 * ▶ 마커 vs 메모리
 *   - /markers: 마커 렌더링용 경량 데이터 (위도/경도 + 썸네일만)
 *   - /memories: 상세 데이터 포함 (일기 내용, 모든 사진 등)
 *
 * ▶ GPS 데이터 출처
 *   사진 EXIF에서 자동 추출. EXIF가 없으면 GPS 없이 저장됨 (지도에 미표시).
 */
@Tag(name = "지도", description = "GPS 기반 반려동물 추억 지도 API. Naver Maps와 연동되며 bbox 필터링으로 최적화됩니다.")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/map")
public class MapController {

    private final MapService mapService;

    // ─────────────────────────────────────────────────────────────
    // 전체 추억 조회 (상세)
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "지도 추억 목록 조회 (상세)",
        description = """
            GPS 좌표가 있는 추억 목록을 상세 데이터와 함께 반환합니다.

            **Query Parameters (모두 선택):**
            - `minLat`, `maxLat`, `minLng`, `maxLng`: Bounding Box (지도 화면 범위)
              - 지정 시 해당 범위 내 추억만 반환
              - 미지정 시 전체 반환
            - `petId`: 특정 반려동물 필터
            - `startDate`, `endDate`: 날짜 범위 필터 (yyyy-MM-dd)

            **응답 포함 데이터:**
            - 추억 제목·날짜·요약
            - 대표 사진 + 모든 사진 목록
            - GPS 좌표 (지도 마커 표시용)
            - 장소명

            **주의:** 데이터 양이 많을 수 있습니다. 지도 화면에서는 `/markers`를 먼저 사용하고,
            마커 클릭 시 `/memories/{memoryId}`로 단건 조회를 권장합니다.
            """
    )
    @GetMapping("/memories")
    public ApiResponse<List<MapMemoryResponse>> getMapMemories(
            @AuthenticationPrincipal User user,
            @Parameter(description = "Bounding Box 남쪽 위도", example = "37.45")
            @RequestParam(required = false) Double minLat,
            @Parameter(description = "Bounding Box 북쪽 위도", example = "37.65")
            @RequestParam(required = false) Double maxLat,
            @Parameter(description = "Bounding Box 서쪽 경도", example = "126.85")
            @RequestParam(required = false) Double minLng,
            @Parameter(description = "Bounding Box 동쪽 경도", example = "127.05")
            @RequestParam(required = false) Double maxLng,
            @Parameter(description = "반려동물 UUID 필터 (미입력 시 전체)")
            @RequestParam(required = false) UUID petId,
            @Parameter(description = "조회 시작 날짜 (yyyy-MM-dd)", example = "2024-01-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "조회 종료 날짜 (yyyy-MM-dd)", example = "2024-12-31")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ApiResponse.success(mapService.getMapMemories(
                UUID.fromString(user.getUsername()),
                minLat, maxLat, minLng, maxLng,
                petId, startDate, endDate));
    }

    // ─────────────────────────────────────────────────────────────
    // 경량 마커 조회 (성능 최적화용)
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "지도 마커 목록 조회 (경량)",
        description = """
            지도 마커 렌더링에 필요한 최소한의 데이터만 반환합니다.

            **필수 Query Parameters (bbox 4개):**
            - `swLat`: 남서쪽 위도 (South-West Latitude)
            - `neLat`: 북동쪽 위도 (North-East Latitude)
            - `swLng`: 남서쪽 경도 (South-West Longitude)
            - `neLng`: 북동쪽 경도 (North-East Longitude)

            **선택 Query Parameters:**
            - `petId`: 반려동물 필터
            - `zoom`: 지도 줌 레벨 (현재 클러스터링 미구현, 향후 활용 예정)

            **응답 포함 데이터:**
            - Memory UUID (마커 클릭 시 상세 조회에 사용)
            - GPS 위도/경도
            - 썸네일 이미지 URL
            - 날짜

            **사용 패턴:**
            ```
            1. 지도 이동/줌 → GET /api/map/markers?swLat=...&neLat=...
            2. 마커 클릭 → GET /api/map/memories/{memoryId}
            ```
            """
    )
    @GetMapping("/markers")
    public ApiResponse<List<MapMarkerResponse>> getMapMarkers(
            @AuthenticationPrincipal User user,
            @Parameter(description = "남서쪽 위도", required = true, example = "37.45")
            @RequestParam double swLat,
            @Parameter(description = "북동쪽 위도", required = true, example = "37.65")
            @RequestParam double neLat,
            @Parameter(description = "남서쪽 경도", required = true, example = "126.85")
            @RequestParam double swLng,
            @Parameter(description = "북동쪽 경도", required = true, example = "127.05")
            @RequestParam double neLng,
            @Parameter(description = "반려동물 UUID 필터 (미입력 시 전체)")
            @RequestParam(required = false) UUID petId,
            @Parameter(description = "지도 줌 레벨 (향후 클러스터링 활용)")
            @RequestParam(required = false) Integer zoom) {

        return ApiResponse.success(mapService.getMapMarkers(
                UUID.fromString(user.getUsername()),
                swLat, neLat, swLng, neLng, petId));
    }

    // ─────────────────────────────────────────────────────────────
    // 검색 자동완성
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "검색 자동완성 (장소명 + 제목)",
        description = """
            검색창 자동완성에 사용할 키워드 목록을 반환합니다.

            **Query Parameters:**
            - `q`: 검색어 (미입력 시 전체 목록)

            **응답:** 장소명과 AI 일기 제목 목록 (중복 제거, 최대 10개)

            검색어 입력 중 debounce (300ms 이상)를 적용하여 호출하는 것을 권장합니다.
            """
    )
    @GetMapping("/search/suggestions")
    public ApiResponse<List<String>> getSearchSuggestions(
            @AuthenticationPrincipal User user,
            @Parameter(description = "검색어 (미입력 시 전체)", example = "한강")
            @RequestParam(required = false) String q) {

        return ApiResponse.success(mapService.getSearchSuggestions(
                UUID.fromString(user.getUsername()), q));
    }

    // ─────────────────────────────────────────────────────────────
    // 키워드 검색
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "키워드로 추억 검색",
        description = """
            키워드로 추억을 검색합니다. 장소명, 일기 제목, 내용, 사용자 메모를 포함하여 검색합니다.

            **Query Parameters:**
            - `keyword` (필수): 검색 키워드
            - `petId` (선택): 반려동물 필터

            **검색 대상:** 장소명(locationName) + AI 제목(aiTitle) + AI 일기 내용 + 사용자 메모

            검색 결과는 `/memories`와 동일한 MapMemoryResponse 형태로 반환됩니다.
            """
    )
    @GetMapping("/search")
    public ApiResponse<List<MapMemoryResponse>> searchMapMemories(
            @AuthenticationPrincipal User user,
            @Parameter(description = "검색 키워드", required = true, example = "한강공원")
            @RequestParam String keyword,
            @Parameter(description = "반려동물 UUID 필터 (미입력 시 전체)")
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(mapService.searchMapMemories(
                UUID.fromString(user.getUsername()), keyword, petId));
    }

    // ─────────────────────────────────────────────────────────────
    // 추억 단건 상세 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "추억 단건 상세 조회 (마커 클릭용)",
        description = """
            지도에서 마커를 클릭했을 때 표시할 추억의 상세 정보를 반환합니다.

            **Path Variable:** `memoryId` - 조회할 추억 UUID

            **응답:** 해당 추억의 전체 상세 정보 (사진, 모멘트, 장소 등)

            **권한:** 본인의 추억만 조회 가능합니다.
            """
    )
    @GetMapping("/memories/{memoryId}")
    public ApiResponse<MapMemoryResponse> getMemoryDetail(
            @AuthenticationPrincipal User user,
            @Parameter(description = "조회할 추억 UUID", required = true)
            @PathVariable UUID memoryId) {

        return ApiResponse.success(mapService.getMemoryDetail(
                UUID.fromString(user.getUsername()), memoryId));
    }
}
