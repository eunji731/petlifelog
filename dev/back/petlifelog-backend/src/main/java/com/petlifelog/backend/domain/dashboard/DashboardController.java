package com.petlifelog.backend.domain.dashboard;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.dashboard.dto.AiReportResponse;
import com.petlifelog.backend.domain.dashboard.dto.DashboardSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AiDashboardService aiDashboardService;

    /**
     * 대시보드 통계 요약
     * - 반려동물 프로필 (나이, 함께한 날, 생일 D-day)
     * - 이번 달 통계 (기록 일수, 방문 장소 수, 베스트 사진 수)
     * - 베스트 사진 목록 (top 6)
     * - 자주 가는 장소 (top 3)
     * - 연속 기록 스트릭
     *
     * @param petId 특정 반려동물 UUID (없으면 전체 기준)
     */
    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryResponse> getSummary(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID petId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        YearMonth ym = (year != null && month != null) ? YearMonth.of(year, month) : YearMonth.now();
        DashboardSummaryResponse summary = dashboardService.getSummary(
                UUID.fromString(user.getUsername()), petId, ym);
        return ApiResponse.success(summary);
    }

    /**
     * AI 월간 리포트
     * - 이번 달: 기록 3개 이상이면 자동 생성 및 캐시
     * - 이전 달: 캐시 있으면 반환, 없으면 hasData: false (수동 새로고침 필요)
     */
    @GetMapping("/ai-report")
    public ApiResponse<AiReportResponse> getAiReport(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID petId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        String yearMonth = resolveYearMonth(year, month);
        AiReportResponse report = aiDashboardService.getOrGenerateReport(
                UUID.fromString(user.getUsername()), petId, yearMonth);
        return ApiResponse.success(report);
    }

    /**
     * AI 리포트 수동 새로고침 (하루 3회 제한, 이번 달/이전 달 모두 가능)
     */
    @PostMapping("/ai-report/refresh")
    public ApiResponse<AiReportResponse> refreshAiReport(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID petId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        String yearMonth = resolveYearMonth(year, month);
        AiReportResponse report = aiDashboardService.refreshReport(
                UUID.fromString(user.getUsername()), petId, yearMonth);
        return ApiResponse.success(report);
    }

    private String resolveYearMonth(Integer year, Integer month) {
        if (year != null && month != null) {
            return String.format("%d-%02d", year, month);
        }
        return YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }
}
