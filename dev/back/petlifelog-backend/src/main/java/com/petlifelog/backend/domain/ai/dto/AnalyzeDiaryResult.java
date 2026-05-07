package com.petlifelog.backend.domain.ai.dto;

import com.petlifelog.backend.common.file.dto.StoredFileInfo;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

/**
 * AI 분석 결과 + 임시 저장된 파일 정보.
 * 프론트엔드는 이 결과를 받아 사용자에게 미리보기를 보여주고,
 * 저장 버튼 클릭 시 storedFiles 를 그대로 /save 에 전달한다.
 */
@Getter
@Builder
public class AnalyzeDiaryResult {

    /** AI 분석 내용 */
    private DailyLogResponse aiResult;

    /** 업로드된 파일들의 임시 저장 정보 - save 요청 시 그대로 전달 */
    private List<StoredFileInfo> storedFiles;
}
