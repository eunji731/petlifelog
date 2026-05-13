package com.petlifelog.backend.common.dto;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [공통 API 응답 래퍼]
 *
 * 모든 API 응답을 동일한 구조로 감싸서 프론트엔드가 일관되게 처리할 수 있도록 합니다.
 *
 * ▶ 성공 응답 예시
 * ```json
 * {
 *   "success": true,
 *   "data": { ... },
 *   "error": null
 * }
 * ```
 *
 * ▶ 실패 응답 예시
 * ```json
 * {
 *   "success": false,
 *   "data": null,
 *   "error": {
 *     "message": "사용자를 찾을 수 없습니다.",
 *     "code": "MEMBER_001"
 *   }
 * }
 * ```
 *
 * ▶ 사용 방법 (컨트롤러에서)
 * ```java
 * return ApiResponse.success(petList);        // 데이터 있는 성공
 * return ApiResponse.success();               // 데이터 없는 성공 (DELETE 등)
 * return ApiResponse.error("메시지", "CODE"); // 오류 응답
 * ```
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class ApiResponse<T> {

    private boolean success;    // 요청 성공 여부
    private T data;             // 성공 시 반환 데이터 (실패 시 null)
    private ApiError error;     // 실패 시 오류 정보 (성공 시 null)

    private ApiResponse(boolean success, T data, ApiError error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    /** 데이터와 함께 성공 응답 반환 */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    /** 데이터 없이 성공 응답 반환 (DELETE, 상태 변경 등) */
    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(true, null, null);
    }

    /** 오류 응답 반환 */
    public static <T> ApiResponse<T> error(String message, String code) {
        return new ApiResponse<>(false, null, new ApiError(message, code));
    }

    /** 오류 상세 정보 */
    @Getter
    @NoArgsConstructor(access = AccessLevel.PRIVATE)
    public static class ApiError {
        private String message; // 사람이 읽을 수 있는 오류 메시지
        private String code;    // 프론트엔드에서 처리할 오류 코드 (예: AUTH_001, PET_NOT_FOUND)

        private ApiError(String message, String code) {
            this.message = message;
            this.code = code;
        }
    }
}
