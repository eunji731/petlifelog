package com.petlifelog.backend.domain.pet.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.pet.service.PetService;
import com.petlifelog.backend.domain.pet.dto.PetRequest;
import com.petlifelog.backend.domain.pet.dto.PetResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * [반려동물 관리 컨트롤러]
 *
 * 한 계정에서 여러 마리의 반려동물을 등록하고 관리할 수 있습니다.
 * 등록된 반려동물 정보는 AI 일기 생성 시 성격·말투 등에 활용됩니다.
 *
 * ▶ 삭제 정책
 *   소프트 삭제(isActive = false) 방식을 사용합니다.
 *   회원 탈퇴 후 재가입 시 반려동물 데이터도 함께 복구됩니다.
 */
@Tag(name = "반려동물", description = "반려동물 프로필 등록·조회·수정·삭제 API. AI 일기의 성격/말투 설정에 활용됩니다.")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/pets")
public class PetController {

    private final PetService petService;

    // ─────────────────────────────────────────────────────────────
    // 반려동물 목록 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "내 반려동물 목록 조회",
        description = """
            현재 로그인한 사용자가 등록한 반려동물 목록을 반환합니다.
            `isActive = true`인 반려동물만 조회됩니다.

            **응답 필드 주요 설명:**
            - `diaryTone`: AI 일기 말투 설정 (예: "귀엽고 발랄하게", "조용하고 차분하게")
            - `personality`: AI 분석 시 성격 반영에 사용
            - `profileImagePath`: 이미지 경로, `/files/{path}`로 접근 가능
            """
    )
    @GetMapping
    public ApiResponse<List<PetResponse>> getPets(@AuthenticationPrincipal User user) {
        return ApiResponse.success(petService.getPets(UUID.fromString(user.getUsername())));
    }

    // ─────────────────────────────────────────────────────────────
    // 반려동물 등록
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "반려동물 등록",
        description = """
            새 반려동물을 등록합니다.

            **요청 Body 예시:**
            ```json
            {
              "name": "초코",
              "breed": "포메라니안",
              "birthDate": "2021-03-15",
              "adoptionDate": "2021-04-01",
              "gender": "FEMALE",
              "weightKg": 2.5,
              "profileImagePath": "profiles/uuid/image.jpg",
              "personality": "활발하고 장난기가 많음",
              "appearance": "갈색 털, 동그란 눈",
              "likes": "공 놀이, 산책",
              "dislikes": "목욕, 혼자 있기",
              "diaryTone": "밝고 귀엽게, 1인칭 반려동물 시점으로"
            }
            ```

            **gender 값:** `MALE` | `FEMALE` | `UNKNOWN`
            """
    )
    @PostMapping
    public ResponseEntity<ApiResponse<PetResponse>> addPet(
            @AuthenticationPrincipal User user,
            @RequestBody PetRequest request) {

        return ResponseEntity.ok(ApiResponse.success(
                petService.addPet(UUID.fromString(user.getUsername()), request)));
    }

    // ─────────────────────────────────────────────────────────────
    // 반려동물 수정
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "반려동물 정보 수정",
        description = """
            특정 반려동물의 정보를 수정합니다. 수정 가능한 모든 필드를 포함해 전달하세요 (전체 업데이트 방식).

            **Path Variable:** `petId` - 수정할 반려동물 UUID

            AI 일기 품질을 높이려면 `personality`(성격)와 `diaryTone`(말투)을 상세히 작성하세요.
            """
    )
    @PutMapping("/{petId}")
    public ResponseEntity<ApiResponse<PetResponse>> updatePet(
            @Parameter(description = "수정할 반려동물 UUID", required = true)
            @PathVariable UUID petId,
            @RequestBody PetRequest request) {

        return ResponseEntity.ok(ApiResponse.success(petService.updatePet(petId, request)));
    }

    // ─────────────────────────────────────────────────────────────
    // 반려동물 삭제
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "반려동물 삭제 (소프트 삭제)",
        description = """
            반려동물을 비활성화합니다. 실제 데이터는 삭제되지 않고 `isActive = false`로 변경됩니다.

            **Path Variable:** `petId` - 삭제할 반려동물 UUID

            **주의:** 삭제된 반려동물에 연결된 기존 일기(Memory) 데이터는 유지됩니다.
            """
    )
    @DeleteMapping("/{petId}")
    public ApiResponse<Void> deletePet(
            @Parameter(description = "삭제할 반려동물 UUID", required = true)
            @PathVariable UUID petId) {
        petService.deletePet(petId);
        return ApiResponse.success();
    }
}
