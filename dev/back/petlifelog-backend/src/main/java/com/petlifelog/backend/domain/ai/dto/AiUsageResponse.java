package com.petlifelog.backend.domain.ai.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiUsageResponse {
    /** 해당 날짜에 사용한 AI 호출 횟수 */
    private long dateCount;
    /** 날짜별 최대 허용 횟수 */
    private int dateLimit;
    /** 오늘 전체 AI 호출 횟수 */
    private long dailyTotal;
    /** 하루 전체 최대 허용 횟수 */
    private int dailyLimit;
    /** 해당 날짜 한도 초과 여부 */
    private boolean dateBlocked;
    /** 하루 전체 한도 초과 여부 */
    private boolean dailyBlocked;
}
