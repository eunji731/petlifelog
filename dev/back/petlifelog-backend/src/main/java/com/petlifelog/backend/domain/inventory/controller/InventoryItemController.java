package com.petlifelog.backend.domain.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.inventory.dto.InventoryItemRequest;
import com.petlifelog.backend.domain.inventory.dto.InventoryItemResponse;
import com.petlifelog.backend.domain.inventory.service.InventoryItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * [인벤토리(용품 관리) 컨트롤러]
 *
 * 반려동물 관련 용품(사료, 간식, 장난감, 건강용품 등)을 관리합니다.
 * AI 제품 분석(/api/ai/analyze-product)과 연계하여 사진으로 제품 정보를 자동 입력할 수 있습니다.
 *
 * ▶ 카테고리 종류
 *   FOOD(사료), SNACK(간식), TOY(장난감), HEALTH(건강용품), CLOTHES(의류), ETC(기타)
 *
 * ▶ 멀티파트 요청 구조
 *   등록/수정 모두 multipart/form-data를 사용합니다.
 *   - `data`: JSON 문자열 (InventoryItemRequest)
 *   - `images`: 제품 이미지 파일 (선택)
 */
@Tag(name = "인벤토리(용품)", description = "반려동물 용품(사료·간식·장난감 등) 관리 API. AI 제품 사진 분석과 연계됩니다.")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/inventory")
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;
    private final ObjectMapper objectMapper;

    // ─────────────────────────────────────────────────────────────
    // 인벤토리 등록
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "인벤토리 아이템 등록",
        description = """
            새 용품을 등록합니다. **multipart/form-data** 방식으로 요청합니다.

            **Form Fields:**
            - `data` (필수): 아이템 정보 JSON 문자열
              ```json
              {
                "name": "로얄캐닌 미니 어덜트",
                "category": "FOOD",
                "brand": "로얄캐닌",
                "flavor": "닭고기",
                "ingredients": ["닭고기", "쌀", "옥수수"],
                "storageMethod": "ROOM",
                "suggestedUsage": "하루 2회 계량컵 기준 1/2컵",
                "rating": 4,
                "stock": 2,
                "price": 35000,
                "isFeeding": true
              }
              ```
            - `images` (선택): 제품 이미지 파일(들)

            **카테고리:** `FOOD` | `SNACK` | `TOY` | `HEALTH` | `CLOTHES` | `ETC`
            **보관방법:** `ROOM` | `COOL` | `FROZEN`

            **Swagger UI에서 테스트 시:** `data` 필드에 JSON을 직접 붙여 넣으세요.
            """
    )
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<InventoryItemResponse> createItem(
            @AuthenticationPrincipal User user,
            @Parameter(description = "제품 이미지 파일 (선택)")
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @Parameter(description = "아이템 정보 JSON 문자열 (InventoryItemRequest)", required = true)
            @RequestParam("data") String dataJson) throws Exception {

        // JSON 문자열을 InventoryItemRequest 객체로 변환
        InventoryItemRequest request = objectMapper.readValue(dataJson, InventoryItemRequest.class);
        InventoryItemResponse response = inventoryItemService.createItem(
                UUID.fromString(user.getUsername()), images, request);
        return ApiResponse.success(response);
    }

    // ─────────────────────────────────────────────────────────────
    // 인벤토리 목록 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "인벤토리 목록 조회",
        description = """
            현재 로그인 사용자의 모든 인벤토리 아이템을 반환합니다.

            **응답 필드 주요 설명:**
            - `isFeeding`: 현재 급여 중인 제품 여부 (true면 "급여 중" 배지 표시)
            - `expiryDateText`: 유통기한 텍스트 (예: "2024년 12월")
            - `expiryDateSpecific`: 정확한 유통기한 날짜 (있는 경우)
            - `openedAt`: 개봉일 (개봉 후 유통기한 계산에 활용)
            - `vibeScore`: AI가 분석한 사진 감성 점수

            프론트엔드에서 카테고리 탭(FOOD/SNACK/TOY 등)으로 필터링해서 사용하세요.
            """
    )
    @GetMapping
    public ApiResponse<List<InventoryItemResponse>> getItems(@AuthenticationPrincipal User user) {
        List<InventoryItemResponse> items = inventoryItemService.getItems(UUID.fromString(user.getUsername()));
        return ApiResponse.success(items);
    }

    // ─────────────────────────────────────────────────────────────
    // 인벤토리 단건 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "인벤토리 아이템 단건 조회",
        description = """
            특정 아이템의 상세 정보를 반환합니다.

            **Path Variable:** `id` - 조회할 아이템 UUID
            """
    )
    @GetMapping("/{id}")
    public ApiResponse<InventoryItemResponse> getItem(
            @AuthenticationPrincipal User user,
            @Parameter(description = "조회할 아이템 UUID", required = true)
            @PathVariable UUID id) {

        InventoryItemResponse response = inventoryItemService.getItem(UUID.fromString(user.getUsername()), id);
        return ApiResponse.success(response);
    }

    // ─────────────────────────────────────────────────────────────
    // 인벤토리 수정
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "인벤토리 아이템 수정",
        description = """
            특정 아이템을 수정합니다. **multipart/form-data** 방식으로 요청합니다.

            **Path Variable:** `id` - 수정할 아이템 UUID

            **Form Fields:** 등록(`POST`)과 동일한 `data` + `images` 구조
            새 이미지를 `images`에 포함하면 기존 이미지가 대체됩니다.
            `images`를 생략하면 기존 이미지가 유지됩니다.
            """
    )
    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<InventoryItemResponse> updateItem(
            @AuthenticationPrincipal User user,
            @Parameter(description = "수정할 아이템 UUID", required = true)
            @PathVariable UUID id,
            @Parameter(description = "새 제품 이미지 파일 (생략 시 기존 유지)")
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @Parameter(description = "수정할 아이템 정보 JSON 문자열", required = true)
            @RequestParam("data") String dataJson) throws Exception {

        InventoryItemRequest request = objectMapper.readValue(dataJson, InventoryItemRequest.class);
        InventoryItemResponse response = inventoryItemService.updateItem(
                UUID.fromString(user.getUsername()), id, images, request);
        return ApiResponse.success(response);
    }

    // ─────────────────────────────────────────────────────────────
    // 인벤토리 삭제
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "인벤토리 아이템 삭제",
        description = """
            특정 아이템을 완전히 삭제합니다. (하드 삭제 - 복구 불가)

            **Path Variable:** `id` - 삭제할 아이템 UUID

            연결된 이미지 파일도 함께 삭제됩니다.
            """
    )
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteItem(
            @AuthenticationPrincipal User user,
            @Parameter(description = "삭제할 아이템 UUID", required = true)
            @PathVariable UUID id) {

        inventoryItemService.deleteItem(UUID.fromString(user.getUsername()), id);
        return ApiResponse.success(null);
    }

    // ─────────────────────────────────────────────────────────────
    // 급여 중 토글
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "급여 중 상태 토글",
        description = """
            아이템의 "현재 급여 중" 상태를 토글합니다. (true ↔ false)

            **Path Variable:** `id` - 토글할 아이템 UUID

            대시보드에서 "지금 먹고 있는 사료" 등을 표시할 때 활용됩니다.
            여러 아이템에 동시에 `isFeeding = true`가 가능합니다.
            """
    )
    @PatchMapping("/{id}/feeding")
    public ApiResponse<InventoryItemResponse> toggleFeeding(
            @AuthenticationPrincipal User user,
            @Parameter(description = "토글할 아이템 UUID", required = true)
            @PathVariable UUID id) {

        InventoryItemResponse response = inventoryItemService.toggleFeeding(
                UUID.fromString(user.getUsername()), id);
        return ApiResponse.success(response);
    }
}
