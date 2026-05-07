package com.petlifelog.backend.domain.ai.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.ai.AiDiaryService;
import com.petlifelog.backend.domain.ai.dto.AnalyzeDiaryResult;
import com.petlifelog.backend.domain.ai.dto.AiUsageResponse;
import com.petlifelog.backend.domain.ai.dto.SaveDiaryRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/ai")
public class AiDiaryController {

    private final AiDiaryService aiDiaryService;

    /**
     * 사용량 조회: 특정 날짜의 AI 호출 횟수 및 오늘 전체 총 횟수 반환
     */
    @GetMapping("/usage")
    public ApiResponse<AiUsageResponse> getUsage(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate) {

        AiUsageResponse usage = aiDiaryService.getUsage(UUID.fromString(user.getUsername()), targetDate);
        return ApiResponse.success(usage);
    }

    /**
     * 1단계: 이미지 업로드 + AI 분석
     *
     * - targetDate: 일기를 작성할 날짜 (yyyy-MM-dd)
     * - 날짜별 2회, 하루 전체 10회 초과 시 429 응답
     * - 이미지를 FileStorageService 로 임시 저장 (files/memory/{sessionId}/...)
     * - Gemini AI 분석 후 결과 반환
     * - 응답의 storedFiles 를 프론트가 보관했다가 /save 시 그대로 전달해야 함
     */
    @PostMapping("/analyze")
    public ApiResponse<AnalyzeDiaryResult> analyzeDiary(
            @AuthenticationPrincipal User user,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            @RequestParam("images") List<MultipartFile> images,
            @RequestParam("petInfo") String petInfoJson,
            @RequestParam(value = "userTags", required = false) List<String> userTags) {

        AnalyzeDiaryResult result = aiDiaryService.analyzeDiary(
                UUID.fromString(user.getUsername()), targetDate, images, petInfoJson, userTags);
        return ApiResponse.success(result);
    }

    /**
     * 2단계: 일기 최종 저장
     *
     * - analyze 응답의 storedFiles 를 그대로 body 에 포함해야 함
     * - Memory + AttachedFile + Photo + MemoryDog 가 한 트랜잭션으로 저장됨
     */
    @PostMapping("/save")
    public ApiResponse<UUID> saveDiary(
            @AuthenticationPrincipal User user,
            @RequestBody SaveDiaryRequest request) {

        UUID memoryId = aiDiaryService.saveDiary(
                UUID.fromString(user.getUsername()),
                request.getAiResult(),
                request.getStoredFiles(),
                request.getPetIds()
        );
        return ApiResponse.success(memoryId);
    }
}
