package com.petlifelog.backend.domain.archive.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.archive.dto.ArchivePhotoResponse;
import com.petlifelog.backend.domain.archive.dto.ThemeTabResponse;
import com.petlifelog.backend.domain.archive.service.ArchiveService;
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

    @GetMapping("/themes")
    public ApiResponse<List<ThemeTabResponse>> getTopThemes(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ApiResponse.success(
                archiveService.getTopThemes(UUID.fromString(user.getUsername()), petId, page, size));
    }

    @GetMapping("/photos")
    public ApiResponse<List<ArchivePhotoResponse>> getPhotosByTheme(
            @AuthenticationPrincipal User user,
            @RequestParam String tag,
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.getPhotosByTheme(UUID.fromString(user.getUsername()), tag, petId));
    }

    @GetMapping("/search")
    public ApiResponse<List<ArchivePhotoResponse>> searchPhotos(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.searchPhotos(UUID.fromString(user.getUsername()), q, petId));
    }

    @GetMapping("/themes/{tag}")
    public ApiResponse<ThemeTabResponse> getThemeByTag(
            @AuthenticationPrincipal User user,
            @PathVariable String tag) {

        return ApiResponse.success(
                archiveService.getThemeByTag(UUID.fromString(user.getUsername()), tag));
    }

    @GetMapping("/themes/search")
    public ApiResponse<List<ThemeTabResponse>> searchThemes(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.searchThemes(UUID.fromString(user.getUsername()), q, petId));
    }

    @GetMapping("/tags/suggest")
    public ApiResponse<List<String>> suggestTags(
            @AuthenticationPrincipal User user,
            @RequestParam String q,
            @RequestParam(required = false) UUID petId) {

        return ApiResponse.success(
                archiveService.suggestTags(UUID.fromString(user.getUsername()), q, petId));
    }
}
