package com.petlifelog.backend.domain.dashboard;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.dashboard.dto.AiReportResponse;
import com.petlifelog.backend.domain.dashboard.dto.DashboardSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(required = false) UUID petId) {

        DashboardSummaryResponse summary = dashboardService.getSummary(
                UUID.fromString(user.getUsername()), petId);
        return ApiResponse.success(summary);
    }

    /**
     * AI 월간 리포트 + 에너지 알림
     * - 이번 달 기록이 3개 이상일 때만 생성 (미만이면 hasData: false)
     * - 이번 달 캐시가 있으면 캐시 반환, 없으면 Gemini 호출 후 저장
     *
     * @param petId 특정 반려동물 UUID (없으면 전체 기준)
     */
    @GetMapping("/ai-report")
    public ApiResponse<AiReportResponse> getAiReport(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID petId) {

        AiReportResponse report = aiDashboardService.getOrGenerateReport(
                UUID.fromString(user.getUsername()), petId);
        return ApiResponse.success(report);
    }

    /**
     * AI 리포트 강제 재생성
     * - 이미 캐시된 이번 달 리포트를 삭제하고 새로 생성
     */
    @PostMapping("/ai-report/refresh")
    public ApiResponse<AiReportResponse> refreshAiReport(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID petId) {

        AiReportResponse report = aiDashboardService.refreshReport(
                UUID.fromString(user.getUsername()), petId);
        return ApiResponse.success(report);
    }
}
