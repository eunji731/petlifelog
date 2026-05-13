package com.petlifelog.backend.domain.dashboard.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.dashboard.dto.AiReportResponse;
import com.petlifelog.backend.domain.dashboard.dto.DashboardSummaryResponse;
import com.petlifelog.backend.domain.dashboard.service.AiDashboardService;
import com.petlifelog.backend.domain.dashboard.service.DashboardService;
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
