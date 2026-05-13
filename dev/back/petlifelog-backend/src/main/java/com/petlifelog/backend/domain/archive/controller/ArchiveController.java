package com.petlifelog.backend.domain.archive.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.archive.dto.ArchivePhotoResponse;
import com.petlifelog.backend.domain.archive.dto.ThemeTabResponse;
import com.petlifelog.backend.domain.archive.service.ArchiveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * [사진 아카이브 컨트롤러]
 *
 * AI가 분석한 테마 태그(themeTags) 기반으로 사진을 분류·검색합니다.
 * 사진이 저장될 때 AI가 자동으로 태그를 부여하고, 이 컨트롤러를 통해 테마별로 탐색합니다.
 *
 * ▶ 테마 태그 예시
 *   공원, 카페, 산책, 봄, 집, 목욕, 해변, 식사 등
 *   (AI가 사진 분석 시 자동 생성, 사용자 직접 입력 불가)
 *
 * ▶ 데이터 흐름
 *   사진 업로드 → AI 분석(Gemini) → PhotoThemeTag 저장 → 아카이브 API로 조회
 */
@Tag(name = "사진 아카이브", description = "AI 테마 태그 기반 사진 분류·탐색 API. AI가 사진마다 자동으로 테마를 부여합니다.")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/archive")
public class ArchiveController {

    private final ArchiveService archiveService;

    // ─────────────────────────────────────────────────────────────
    // 상위 테마 목록 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "상위 테마 목록 조회 (탭 목록)",
        description = """
            사진이 가장 많이 분류된 테마 목록을 반환합니다. 아카이브 화면의 탭 목록으로 사용됩니다.

            **Query Parameters:**
            - `petId` (선택): 특정 반려동물 필터
            - `page` (기본값: 0): 페이지 번호
            - `size` (기본값: 10): 페이지 당 테마 수

            **응답 포함 데이터:**
            - `tag`: 테마 이름 (예: "공원", "산책")
            - `photoCount`: 해당 테마에 속한 사진 수
            - `representativePhotoUrl`: 대표 사진 URL
            - `latestDate`: 가장 최근 사진 날짜

            사용 예시: 앱의 "아카이브" 탭에서 태그 탭 목록으로 표시
            """
    )
    @GetMapping("/themes")
    public ApiResponse<List<ThemeTabResponse>> getTopThemes(
            @AuthenticationPrincipal User user,
            @Parameter(description = "반려동물 UUID 필터 (미입력 시 전체)")
            @RequestParam(required = false) UUID petId,
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 당 테마 수", example = "10")
            @RequestParam(defaultValue = "10") int size) {

        return ApiResponse.success(
                archiveService.getTopThemes(UUID.fromString(user.getUsername()), petId, page, size));
    }

    // ─────────────────────────────────────────────────────────────
    // 테마별 사진 목록 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "테마별 사진 목록 조회",
        description = """
            특정 테마 태그에 해당하는 모든 사진을 반환합니다.

            **Query Parameters:**
            - `tag` (필수): 테마 태그 이름 (예: "공원", "산책", "봄")
            - `petId` (선택): 반려동물 필터

            **응답 포함 데이터:**
            - 사진 원본·썸네일 URL
            - 촬영 날짜
            - AI 캡션 (반려동물 시점 한 줄 설명)
            - vibe 점수 (AI 사진 품질 점수 1~100)
            - isBest (해당 모멘트의 베스트 사진 여부)
            - 연결된 Memory UUID (일기 연결 버튼에 활용)

            사진은 vibe 점수 내림차순으로 정렬됩니다.
            """
    )
    @GetMapping("/photos")
    public ApiResponse<List<ArchivePhotoResponse>> getPhotosByTheme(
            @AuthenticationPrincipal User user,
            @Parameter(description = "테마 태그 이름", required = true, example = "공원")
            @RequestParam String tag,
            @Parameter(description = "반려동물 UUID 필터 (미입력 시 전체)")
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.getPhotosByTheme(UUID.fromString(user.getUsername()), tag, petId));
    }

    // ─────────────────────────────────────────────────────────────
    // 사진 키워드 검색
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "사진 키워드 검색",
        description = """
            키워드로 사진을 검색합니다. AI 캡션과 테마 태그를 대상으로 검색합니다.

            **Query Parameters:**
            - `q` (필수): 검색 키워드
            - `petId` (선택): 반려동물 필터

            **검색 대상:** AI 캡션(photoComment) + 테마 태그(themeTags)

            응답 형태는 `/photos`와 동일합니다.
            """
    )
    @GetMapping("/search")
    public ApiResponse<List<ArchivePhotoResponse>> searchPhotos(
            @AuthenticationPrincipal User user,
            @Parameter(description = "검색 키워드", required = true, example = "공원 산책")
            @RequestParam String q,
            @Parameter(description = "반려동물 UUID 필터 (미입력 시 전체)")
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.searchPhotos(UUID.fromString(user.getUsername()), q, petId));
    }

    // ─────────────────────────────────────────────────────────────
    // 특정 테마 단건 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "특정 테마 정보 조회",
        description = """
            특정 태그의 테마 통계 정보를 조회합니다.

            **Path Variable:** `tag` - 조회할 테마 태그 이름 (예: "공원")

            아카이브 카테고리 상세 페이지 헤더 데이터로 활용합니다.
            """
    )
    @GetMapping("/themes/{tag}")
    public ApiResponse<ThemeTabResponse> getThemeByTag(
            @AuthenticationPrincipal User user,
            @Parameter(description = "조회할 테마 태그 이름", required = true, example = "공원")
            @PathVariable String tag) {

        return ApiResponse.success(
                archiveService.getThemeByTag(UUID.fromString(user.getUsername()), tag));
    }

    // ─────────────────────────────────────────────────────────────
    // 테마 검색
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "테마 검색",
        description = """
            테마 이름으로 검색합니다. 아카이브 검색창에서 테마를 찾을 때 사용합니다.

            **Query Parameters:**
            - `q` (필수): 검색할 테마 키워드
            - `petId` (선택): 반려동물 필터
            """
    )
    @GetMapping("/themes/search")
    public ApiResponse<List<ThemeTabResponse>> searchThemes(
            @AuthenticationPrincipal User user,
            @Parameter(description = "테마 검색 키워드", required = true, example = "공원")
            @RequestParam String q,
            @Parameter(description = "반려동물 UUID 필터 (미입력 시 전체)")
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.searchThemes(UUID.fromString(user.getUsername()), q, petId));
    }

    // ─────────────────────────────────────────────────────────────
    // 태그 자동완성
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "태그 자동완성 제안",
        description = """
            검색창 자동완성에 사용할 태그 이름 목록을 반환합니다.

            **Query Parameters:**
            - `q` (필수): 입력 중인 검색어 (최소 1글자)
            - `petId` (선택): 반려동물 필터

            **응답:** 일치하는 태그 이름 문자열 목록 (최대 10개)

            검색어 입력 중 debounce(300ms)를 적용하여 호출하는 것을 권장합니다.
            """
    )
    @GetMapping("/tags/suggest")
    public ApiResponse<List<String>> suggestTags(
            @AuthenticationPrincipal User user,
            @Parameter(description = "검색어 접두사", required = true, example = "공")
            @RequestParam String q,
            @Parameter(description = "반려동물 UUID 필터 (미입력 시 전체)")
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.suggestTags(UUID.fromString(user.getUsername()), q, petId));
    }
}
