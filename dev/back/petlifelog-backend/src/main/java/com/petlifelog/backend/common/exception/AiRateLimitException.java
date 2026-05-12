package com.petlifelog.backend.common.exception;

import lombok.Getter;

@Getter
public class AiRateLimitException extends RuntimeException {

    private final String errorCode;

    public AiRateLimitException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    /** 특정 날짜 2회 초과 */
    public static AiRateLimitException dateLimitExceeded(String targetDate) {
        return new AiRateLimitException(
                targetDate + " 날짜의 AI 일기 작성 기회(2회)를 모두 사용했습니다. 다른 날짜를 선택해 주세요.",
                "AI_DATE_LIMIT_EXCEEDED"
        );
    }

    /** 하루 총 10회 초과 */
    public static AiRateLimitException dailyLimitExceeded() {
        return new AiRateLimitException(
                "오늘의 AI 일기 작성 한도(10회)를 모두 사용했습니다. 내일 다시 시도해 주세요.",
                "AI_DAILY_LIMIT_EXCEEDED"
        );
    }

    /** 대시보드 리포트 새로고침 하루 3회 초과 */
    public static AiRateLimitException dashboardRefreshLimitExceeded() {
        return new AiRateLimitException(
                "오늘의 AI 리포트 새로고침 횟수(3회)를 모두 사용했습니다. 내일 다시 시도해 주세요.",
                "AI_DASHBOARD_REFRESH_LIMIT_EXCEEDED"
        );
    }
}
