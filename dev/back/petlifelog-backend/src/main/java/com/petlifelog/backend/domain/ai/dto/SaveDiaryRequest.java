package com.petlifelog.backend.domain.ai.dto;

import com.petlifelog.backend.common.file.dto.StoredFileInfo;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class SaveDiaryRequest {

    private DailyLogResponse aiResult;

    /** analyze 단계에서 받은 storedFiles 를 그대로 전달한다. */
    private List<StoredFileInfo> storedFiles;

    private List<String> petIds;
}
