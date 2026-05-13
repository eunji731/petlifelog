package com.petlifelog.backend.domain.ai.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.ai.service.AiDiaryService;
import com.petlifelog.backend.domain.ai.service.AiInventoryService;
import com.petlifelog.backend.domain.ai.dto.AnalyzeDiaryResult;
import com.petlifelog.backend.domain.ai.dto.AnalyzeProductResult;
import com.petlifelog.backend.domain.ai.dto.AiUsageResponse;
import com.petlifelog.backend.domain.ai.dto.CheckMetadataResponse;
import com.petlifelog.backend.domain.ai.dto.SaveDiaryRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * [AI 일기 생성 컨트롤러]
 *
 * 사진 → AI 분석 → 일기 저장의 3단계 흐름을 제공합니다.
 *
 * ▶ 전체 흐름
 *   0단계: POST /check-metadata  → 이미지 EXIF 날짜·GPS 여부만 확인 (AI 호출 없음)
 *   1단계: POST /analyze         → 이미지 업로드 + Gemini AI 분석 (rate limit 차감)
 *   2단계: POST /save            → AI 결과를 DB에 최종 저장 (Memory 생성)
 *
 * ▶ 별도 기능
 *   - GET  /usage                → 오늘 AI 사용량 조회
 *   - POST /analyze-product      → 인벤토리 제품 이미지 AI 분석
 */
@Tag(name = "AI 일기", description = "사진을 Gemini AI로 분석하여 반려동물 일기를 생성하는 API. 날짜별 2회 / 하루 10회 사용 제한이 있습니다.")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/ai")
public class AiDiaryController {

    private final AiDiaryService aiDiaryService;
    private final AiInventoryService aiInventoryService;

    // ─────────────────────────────────────────────────────────────
    // 사용량 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "AI 사용량 조회",
        description = """
            특정 날짜의 AI 분석 호출 횟수와 오늘 전체 총 호출 횟수를 반환합니다.

            **제한:**
            - `dateCount` ≥ 2 → 해당 날짜 일기 분석 불가 (`dateBlocked: true`)
            - `dailyTotal` ≥ 10 → 오늘 하루 전체 분석 불가 (`dailyBlocked: true`)

            분석 버튼을 활성화/비활성화하기 전에 먼저 이 API를 호출하세요.
            """
    )
    @GetMapping("/usage")
    public ApiResponse<AiUsageResponse> getUsage(
            @AuthenticationPrincipal User user,
            @Parameter(description = "조회할 날짜 (yyyy-MM-dd)", example = "2024-05-13", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate) {

        AiUsageResponse usage = aiDiaryService.getUsage(UUID.fromString(user.getUsername()), targetDate);
        return ApiResponse.success(usage);
    }

    // ─────────────────────────────────────────────────────────────
    // 0단계: 메타데이터 확인 (AI 호출 없음)
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "이미지 메타데이터 확인 (0단계)",
        description = """
            이미지 파일에서 EXIF 날짜와 GPS 정보가 있는지 확인합니다.
            **AI를 호출하지 않으므로 rate limit이 차감되지 않습니다.**

            사용자에게 "이 사진에는 날짜 정보가 없어요. 날짜를 직접 선택해주세요." 같은 안내를 보여줄 때 활용하세요.

            **요청:** `multipart/form-data`
            - `images`: 확인할 이미지 파일들 (여러 장 가능)
            """
    )
    @PostMapping("/check-metadata")
    public ApiResponse<List<CheckMetadataResponse>> checkMetadata(
            @Parameter(description = "EXIF 확인할 이미지 파일 목록")
            @RequestParam("images") List<MultipartFile> images) {

        return ApiResponse.success(aiDiaryService.checkMetadata(images));
    }

    // ─────────────────────────────────────────────────────────────
    // 1단계: 이미지 업로드 + AI 분석
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "AI 일기 분석 (1단계) ★ Rate Limit 있음",
        description = """
            이미지를 서버에 임시 저장하고 Google Gemini AI로 분석하여 일기 초안을 생성합니다.

            **⚠️ Rate Limit:** 날짜별 2회 / 하루 전체 10회 초과 시 429 응답

            **요청:** `multipart/form-data`
            - `targetDate` (query): 일기 날짜 (yyyy-MM-dd)
            - `images`: 이미지 파일 목록 (JPEG/PNG 권장)
            - `petInfo` (JSON 문자열): 반려동물 정보 배열
              ```json
              [{"id": "uuid-여기에", "name": "초코"}]
              ```
            - `userTags` (optional): 사용자가 직접 입력한 키워드 (예: 공원, 신나는)

            **응답:**
            - `aiResult`: AI가 생성한 일기 제목·요약·모멘트 목록
            - `storedFiles`: 서버에 임시 저장된 파일 정보 → **2단계(/save)에 그대로 전달해야 합니다!**

            **주의:** `storedFiles`를 분실하면 임시 파일이 고아 파일로 남아 24시간 후 삭제됩니다.
            """
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "AI 분석 성공"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "AI 사용 횟수 초과 (날짜별 2회 / 하루 10회)")
    })
    @PostMapping("/analyze")
    public ApiResponse<AnalyzeDiaryResult> analyzeDiary(
            @AuthenticationPrincipal User user,
            @Parameter(description = "일기를 작성할 날짜", example = "2024-05-13", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            @Parameter(description = "분석할 이미지 파일 목록")
            @RequestParam("images") List<MultipartFile> images,
            @Parameter(description = "반려동물 정보 JSON 배열 문자열. [{\"id\":\"uuid\",\"name\":\"이름\"}]", required = true)
            @RequestParam("petInfo") String petInfoJson,
            @Parameter(description = "사용자 직접 입력 키워드 (선택)", example = "공원,산책,행복")
            @RequestParam(value = "userTags", required = false) List<String> userTags) {

        AnalyzeDiaryResult result = aiDiaryService.analyzeDiary(
                UUID.fromString(user.getUsername()), targetDate, images, petInfoJson, userTags);
        return ApiResponse.success(result);
    }

    // ─────────────────────────────────────────────────────────────
    // 2단계: 일기 최종 저장
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "AI 일기 저장 (2단계)",
        description = """
            1단계(/analyze) 응답을 받아 일기를 DB에 최종 저장합니다.

            **요청 Body (JSON):**
            ```json
            {
              "targetDate": "2024-05-13",
              "aiResult": { /* /analyze 응답의 aiResult 그대로 */ },
              "storedFiles": [ /* /analyze 응답의 storedFiles 그대로 */ ],
              "petIds": ["반려동물-uuid-1", "반려동물-uuid-2"]
            }
            ```

            **저장되는 데이터:**
            - `Memory` (일기 레코드)
            - `MemoryMoment` (모멘트 목록)
            - `Photo` (사진 레코드, AI 캡션·vibe점수 포함)
            - `PhotoThemeTag` (사진 테마 태그)
            - `MemoryDog` (일기-반려동물 연결)
            - `AttachedFile` (임시 → 정식 파일 전환)

            **응답:** 생성된 Memory의 UUID
            """
    )
    @PostMapping("/save")
    public ApiResponse<UUID> saveDiary(
            @AuthenticationPrincipal User user,
            @RequestBody SaveDiaryRequest request) {

        UUID memoryId = aiDiaryService.saveDiary(
                UUID.fromString(user.getUsername()),
                request.getTargetDate(),
                request.getAiResult(),
                request.getStoredFiles(),
                request.getPetIds()
        );
        return ApiResponse.success(memoryId);
    }

    // ─────────────────────────────────────────────────────────────
    // 인벤토리 제품 AI 분석
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "인벤토리 제품 AI 분석",
        description = """
            제품 사진(최대 3장)을 Gemini AI로 분석하여 제품명·브랜드·성분·보관방법 등을 자동 추출합니다.

            **요청:** `multipart/form-data`
            - `images`: 제품 사진 (최대 3장 권장, 성분표가 찍힌 사진 포함 시 정확도 높아짐)

            **응답 예시:**
            ```json
            {
              "name": "로얄캐닌 미니 어덜트",
              "brand": "로얄캐닌",
              "category": "FOOD",
              "ingredients": ["닭고기", "쌀", "옥수수"],
              "storageMethod": "ROOM",
              "suggestedUsage": "하루 2회, 계량컵 기준 1/2컵"
            }
            ```

            **주의:** 이 API도 AI 호출을 사용하므로 하루 사용량에 포함될 수 있습니다.
            """
    )
    @PostMapping("/analyze-product")
    public ApiResponse<AnalyzeProductResult> analyzeProduct(
            @AuthenticationPrincipal User user,
            @Parameter(description = "제품 사진 (최대 3장)")
            @RequestParam("images") List<MultipartFile> images) {

        AnalyzeProductResult result = aiInventoryService.analyzeProduct(
                UUID.fromString(user.getUsername()), images);
        return ApiResponse.success(result);
    }
}
