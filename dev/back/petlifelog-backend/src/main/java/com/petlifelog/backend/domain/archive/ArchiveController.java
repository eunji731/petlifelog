package com.petlifelog.backend.domain.archive;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.archive.dto.ArchivePhotoResponse;
import com.petlifelog.backend.domain.archive.dto.ThemeTabResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/archive")
public class ArchiveController {

    private final ArchiveService archiveService;

    /**
     * 도감 탭 목록: 데이터 많은 순 테마 (페이지네이션)
     * GET /api/archive/themes?petId=&page=0&size=10
     */
    @GetMapping("/themes")
    public ApiResponse<List<ThemeTabResponse>> getTopThemes(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ApiResponse.success(
                archiveService.getTopThemes(UUID.fromString(user.getUsername()), petId, page, size));
    }

    /**
     * 탭 클릭: 정확한 태그 일치 사진 목록
     * GET /api/archive/photos?tag=봄&petId=
     */
    @GetMapping("/photos")
    public ApiResponse<List<ArchivePhotoResponse>> getPhotosByTheme(
            @AuthenticationPrincipal User user,
            @RequestParam String tag,
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.getPhotosByTheme(UUID.fromString(user.getUsername()), tag, petId));
    }

    /**
     * 검색창: 키워드 부분 일치 사진 목록
     * GET /api/archive/search?q=꽃&petId=
     */
    @GetMapping("/search")
    public ApiResponse<List<ArchivePhotoResponse>> searchPhotos(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.searchPhotos(UUID.fromString(user.getUsername()), q, petId));
    }

    /**
     * 태그 단건 조회: 대표사진 및 사진 수
     * GET /api/archive/themes/{tag}
     */
    @GetMapping("/themes/{tag}")
    public ApiResponse<ThemeTabResponse> getThemeByTag(
            @AuthenticationPrincipal User user,
            @PathVariable String tag) {

        return ApiResponse.success(
                archiveService.getThemeByTag(UUID.fromString(user.getUsername()), tag));
    }

    /**
     * 검색창: 키워드 부분 일치 테마(태그) 목록
     * GET /api/archive/themes/search?q=꽃&petId=
     */
    @GetMapping("/themes/search")
    public ApiResponse<List<ThemeTabResponse>> searchThemes(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.searchThemes(UUID.fromString(user.getUsername()), q, petId));
    }

    /**
     * 검색 자동완성: 태그명 후보 목록
     * GET /api/archive/tags/suggest?q=꽃&petId=
     */
    @GetMapping("/tags/suggest")
    public ApiResponse<List<String>> suggestTags(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.suggestTags(UUID.fromString(user.getUsername()), q, petId));
    }
}
