package com.petlifelog.backend.domain.memory.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.memory.dto.MemoryListResponse;
import com.petlifelog.backend.domain.memory.service.MemoryService;
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
 * [추억(일기) 조회·삭제 컨트롤러]
 *
 * 저장된 일기(Memory) 목록 조회와 삭제를 담당합니다.
 * 일기 생성은 AI 분석 흐름인 /api/ai/save를 통해 이루어집니다.
 *
 * ▶ Memory 구조
 *   Memory (일기 헤더)
 *     └─ MemoryMoment (시간대별 모멘트)
 *          └─ Photo (사진 여러 장)
 *               └─ PhotoThemeTag (테마 태그)
 *     └─ MemoryDog (연결된 반려동물)
 */
@Tag(name = "추억(일기)", description = "AI로 생성된 반려동물 일기 조회 및 삭제 API. 생성은 /api/ai/save를 사용하세요.")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/memories")
public class MemoryController {

    private final MemoryService memoryService;

    // ─────────────────────────────────────────────────────────────
    // 일기 목록 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "일기 목록 조회",
        description = """
            로그인 사용자의 일기 목록을 반환합니다. 날짜 범위로 필터링할 수 있습니다.

            **Query Parameters (모두 선택):**
            - `startDate`: 조회 시작 날짜 (yyyy-MM-dd). 미입력 시 전체 조회
            - `endDate`: 조회 종료 날짜 (yyyy-MM-dd). 미입력 시 전체 조회

            **사용 예시:**
            - 달력의 특정 월 조회: `startDate=2024-05-01&endDate=2024-05-31`
            - 특정 날짜 하루: `startDate=2024-05-13&endDate=2024-05-13`
            - 전체 조회: 파라미터 없이 호출

            **응답 포함 데이터:**
            - 일기 요약·제목·날짜
            - 연결된 반려동물 목록
            - 대표 사진 경로
            - 모멘트 목록 (각 모멘트의 사진 포함)
            """
    )
    @GetMapping
    public ApiResponse<List<MemoryListResponse>> getMemories(
            @AuthenticationPrincipal User user,
            @Parameter(description = "조회 시작 날짜 (yyyy-MM-dd)", example = "2024-05-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "조회 종료 날짜 (yyyy-MM-dd)", example = "2024-05-31")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ApiResponse.success(
                memoryService.getMemories(UUID.fromString(user.getUsername()), startDate, endDate));
    }

    // ─────────────────────────────────────────────────────────────
    // 일기 삭제
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "일기 삭제",
        description = """
            특정 일기와 연결된 모든 데이터를 삭제합니다.

            **Path Variable:** `memoryId` - 삭제할 일기 UUID

            **삭제되는 데이터:**
            - Memory (일기 헤더)
            - MemoryMoment (모멘트 목록)
            - Photo (사진 레코드)
            - PhotoThemeTag (테마 태그)
            - MemoryDog (반려동물 연결)
            - AttachedFile (첨부 파일 레코드)

            **주의:** 실제 이미지 파일은 스토리지에서 함께 삭제됩니다. 복구 불가능합니다.

            **권한:** 본인의 일기만 삭제 가능합니다. 타인 일기 삭제 시도 시 403 응답.
            """
    )
    @DeleteMapping("/{memoryId}")
    public ApiResponse<Void> deleteMemory(
            @AuthenticationPrincipal User user,
            @Parameter(description = "삭제할 일기 UUID", required = true)
            @PathVariable UUID memoryId) {

        memoryService.deleteMemory(UUID.fromString(user.getUsername()), memoryId);
        return ApiResponse.success();
    }
}
