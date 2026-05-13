package com.petlifelog.backend.domain.dashboard.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.dashboard.dto.AiReportResponse;
import com.petlifelog.backend.domain.dashboard.dto.DashboardSummaryResponse;
import com.petlifelog.backend.domain.dashboard.service.AiDashboardService;
import com.petlifelog.backend.domain.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * [대시보드 컨트롤러]
 *
 * 홈 화면에 표시되는 월별 통계와 AI 월간 리포트를 제공합니다.
 *
 * ▶ 대시보드 구성
 *   1. 월별 요약 통계 (기록일 수, 방문 장소 수, 베스트 사진, 연속 기록 streak)
 *   2. AI 월간 리포트 (Gemini AI가 분석한 이달의 활동 패턴, 성격 분석, 다음 달 제안)
 *
 * ▶ AI 리포트 생성 조건
 *   - 해당 월에 Memory가 3개 이상 있어야 AI 리포트 생성 가능
 *   - 기존 리포트가 있으면 캐시된 결과 반환 (재호출 없음)
 *   - /refresh로 강제 재생성 가능 (하루 3회 제한)
 */
@Tag(name = "대시보드", description = "월별 통계와 AI 월간 리포트 API. 홈 화면 데이터를 제공합니다.")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AiDashboardService aiDashboardService;

    // ─────────────────────────────────────────────────────────────
    // 월별 요약 통계
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "월별 요약 통계 조회",
        description = """
            특정 월의 반려동물 기록 통계를 반환합니다.

            **Query Parameters (모두 선택):**
            - `petId`: 특정 반려동물 UUID (미입력 시 전체 반려동물 합산)
            - `year`: 조회 연도 (미입력 시 현재 연도)
            - `month`: 조회 월 (미입력 시 현재 월)

            **응답 포함 데이터:**
            - `recordedDays`: 기록한 날 수
            - `totalDays`: 해당 월 총 일 수
            - `uniquePlaceCount`: 방문한 장소 수
            - `topPlaces`: 가장 많이 방문한 장소 목록
            - `bestPhotos`: 베스트 사진 4장
            - `streak`: 연속 기록 일 수
            - `energyAverage`: 평균 활동 에너지 (1~5)
            """
    )
    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryResponse> getSummary(
            @AuthenticationPrincipal User user,
            @Parameter(description = "필터링할 반려동물 UUID (미입력 시 전체)", example = "550e8400-e29b-41d4-a716-446655440000")
            @RequestParam(required = false) UUID petId,
            @Parameter(description = "조회 연도", example = "2024")
            @RequestParam(required = false) Integer year,
            @Parameter(description = "조회 월 (1~12)", example = "5")
            @RequestParam(required = false) Integer month) {

        // year, month 중 하나라도 없으면 현재 월로 처리
        YearMonth ym = (year != null && month != null) ? YearMonth.of(year, month) : YearMonth.now();
        DashboardSummaryResponse summary = dashboardService.getSummary(
                UUID.fromString(user.getUsername()), petId, ym);
        return ApiResponse.success(summary);
    }

    // ─────────────────────────────────────────────────────────────
    // AI 월간 리포트 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "AI 월간 리포트 조회",
        description = """
            Gemini AI가 분석한 이달의 반려동물 활동 패턴 리포트를 반환합니다.

            **Query Parameters:** `/summary`와 동일

            **생성 조건:** 해당 월에 Memory가 3개 이상 있어야 합니다.
            조건 미달 시 `available: false`와 함께 안내 메시지가 반환됩니다.

            **캐싱:** 이미 생성된 리포트는 DB에서 즉시 반환됩니다 (AI 재호출 없음).

            **응답 포함 데이터:**
            - `monthlyHeadline`: 이달의 한 줄 요약
            - `monthlyNarrative`: 이달 활동 서사 (2~3문단)
            - `monthlyHighlights`: 이달의 하이라이트 목록
            - `personalityType/Label`: AI가 분석한 이달의 성격 유형
            - `activityTrend`: 활동 에너지 트렌드 (UP/STABLE/DOWN)
            - `locationVerdict`: 장소 패턴 분석 (VARIED/FOCUSED/ROUTINE/LOW_DATA)
            - `guardianMessage`: 보호자에게 전하는 메시지
            - `nextSuggestion`: 다음 달 추천 활동
            """
    )
    @GetMapping("/ai-report")
    public ApiResponse<AiReportResponse> getAiReport(
            @AuthenticationPrincipal User user,
            @Parameter(description = "필터링할 반려동물 UUID (미입력 시 전체)")
            @RequestParam(required = false) UUID petId,
            @Parameter(description = "조회 연도", example = "2024")
            @RequestParam(required = false) Integer year,
            @Parameter(description = "조회 월 (1~12)", example = "5")
            @RequestParam(required = false) Integer month) {

        String yearMonth = resolveYearMonth(year, month);
        AiReportResponse report = aiDashboardService.getOrGenerateReport(
                UUID.fromString(user.getUsername()), petId, yearMonth);
        return ApiResponse.success(report);
    }

    // ─────────────────────────────────────────────────────────────
    // AI 월간 리포트 강제 재생성
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "AI 월간 리포트 강제 재생성 ★ Rate Limit 있음",
        description = """
            기존 AI 리포트를 삭제하고 Gemini AI로 새로 생성합니다.

            **⚠️ Rate Limit:** 하루 3회 제한 (초과 시 429 응답)

            새 일기를 추가한 후 리포트를 업데이트하거나,
            AI 결과가 마음에 들지 않을 때 재생성하는 용도입니다.

            **Query Parameters:** `/summary`와 동일
            """
    )
    @PostMapping("/ai-report/refresh")
    public ApiResponse<AiReportResponse> refreshAiReport(
            @AuthenticationPrincipal User user,
            @Parameter(description = "필터링할 반려동물 UUID (미입력 시 전체)")
            @RequestParam(required = false) UUID petId,
            @Parameter(description = "조회 연도", example = "2024")
            @RequestParam(required = false) Integer year,
            @Parameter(description = "조회 월 (1~12)", example = "5")
            @RequestParam(required = false) Integer month) {

        String yearMonth = resolveYearMonth(year, month);
        AiReportResponse report = aiDashboardService.refreshReport(
                UUID.fromString(user.getUsername()), petId, yearMonth);
        return ApiResponse.success(report);
    }

    // ─────────────────────────────────────────────────────────────
    // 내부 유틸 메서드
    // ─────────────────────────────────────────────────────────────

    /** year/month 파라미터가 없으면 현재 월로 대체합니다. */
    private String resolveYearMonth(Integer year, Integer month) {
        if (year != null && month != null) {
            return String.format("%d-%02d", year, month);
        }
        return YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }
}
