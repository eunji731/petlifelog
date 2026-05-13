package com.petlifelog.backend.common.auth;

import com.petlifelog.backend.common.auth.dto.TokenResponse;
import com.petlifelog.backend.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

/**
 * [인증 관련 API 컨트롤러]
 *
 * 카카오 로그인 자체는 Spring Security OAuth2가 처리합니다.
 * 이 컨트롤러는 로그인 이후의 토큰 관리(재발급, 로그아웃)만 담당합니다.
 *
 * ▶ 토큰 구조
 *   - accessToken: 24시간 유효, 모든 API 요청에 사용 (HttpOnly 쿠키)
 *   - refreshToken: 14일 유효, 액세스 토큰 재발급에만 사용 (HttpOnly 쿠키)
 *   - 두 토큰 모두 SameSite=Lax 설정으로 CSRF 공격 방어
 *
 * ▶ 토큰 재발급 흐름 (프론트엔드 참고)
 *   1. API 요청 → 401 응답 수신
 *   2. POST /api/auth/reissue 호출 (refreshToken 쿠키 자동 포함)
 *   3. 성공 → 새 accessToken 쿠키 수신 → 원래 요청 재시도
 *   4. 실패(refreshToken 만료) → 로그인 페이지로 리다이렉트
 */
@Tag(name = "인증", description = "JWT 토큰 재발급 및 로그아웃 API. 카카오 로그인은 /oauth2/authorization/kakao 로 시작합니다.")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String kakaoClientId;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    // ─────────────────────────────────────────────────────────────
    // 토큰 재발급
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "액세스 토큰 재발급 (공개 API)",
        description = """
            만료된 accessToken을 refreshToken으로 갱신합니다. **인증 불필요** (공개 API)

            **동작 방식:**
            1. 요청 쿠키에서 `refreshToken` 추출
            2. 토큰 서명 검증 + DB 해시 비교 (토큰 탈취 감지)
            3. 새 accessToken + refreshToken 발급 → 쿠키에 설정
            4. (보안) 기존 refreshToken은 무효화되고 새 토큰으로 교체됨 (Refresh Token Rotation)

            **오류 시:**
            - `refreshToken` 쿠키 없음 → 401
            - refreshToken 서명 무효 또는 만료 → 401
            - DB에 저장된 해시와 불일치 (토큰 재사용 감지) → 401

            프론트엔드는 이 API 실패 시 로그인 페이지로 리다이렉트해야 합니다.
            """
    )
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "재발급 성공 (새 쿠키 Set-Cookie 헤더로 전달)"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "refreshToken 없음 또는 만료")
    })
    @PostMapping("/reissue")
    public ResponseEntity<ApiResponse<Void>> reissue(HttpServletRequest request, HttpServletResponse response) {
        // 1. 요청 쿠키에서 'refreshToken'을 꺼냅니다.
        String refreshToken = extractCookie(request, "refreshToken");
        if (refreshToken == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("리프레시 토큰이 없습니다.", "AUTH_001"));
        }

        // 2. 서비스 로직을 통해 새 토큰들을 생성합니다. (검증 포함)
        TokenResponse tokenResponse = authService.reissue(refreshToken);

        // 3. 새로 만든 토큰들을 다시 쿠키에 구워서 응답에 실어 보냅니다. (기존 쿠키 덮어쓰기)
        addCookie(response, "accessToken", tokenResponse.getAccessToken(), (int) Duration.ofHours(24).toSeconds());
        addCookie(response, "refreshToken", tokenResponse.getRefreshToken(), (int) Duration.ofDays(14).toSeconds());

        return ResponseEntity.ok(ApiResponse.success());
    }

    // ─────────────────────────────────────────────────────────────
    // 로그아웃
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "로그아웃",
        description = """
            현재 사용자를 로그아웃 처리합니다.

            **처리 내용:**
            1. DB에서 refreshToken 해시 삭제 (서버 측 세션 무효화)
            2. 브라우저 쿠키(accessToken, refreshToken) 즉시 삭제
            3. 카카오 로그아웃 URL 반환

            **응답 Body:**
            ```json
            {
              "kakaoLogoutUrl": "https://kauth.kakao.com/oauth/logout?client_id=...&logout_redirect_uri=..."
            }
            ```

            프론트엔드는 응답의 `kakaoLogoutUrl`로 리다이렉트하여 카카오 세션도 함께 종료해야 합니다.
            """
    )
    @PostMapping("/logout")
    public ApiResponse<Map<String, String>> logout(@AuthenticationPrincipal User user, HttpServletResponse response) {
        authService.logout(user.getUsername());

        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");

        // 카카오 로그아웃 URL 구성 (카카오 세션도 함께 종료)
        String logoutRedirectUri = frontendUrl + "/login";
        String kakaoLogoutUrl = "https://kauth.kakao.com/oauth/logout?client_id=" + kakaoClientId
                + "&logout_redirect_uri=" + logoutRedirectUri;

        return ApiResponse.success(Map.of("kakaoLogoutUrl", kakaoLogoutUrl));
    }

    // ─────────────────────────────────────────────────────────────
    // 내부 유틸 메서드
    // ─────────────────────────────────────────────────────────────

    /** 요청에서 특정 이름의 쿠키 값을 추출합니다. */
    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
