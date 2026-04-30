package com.petlifelog.backend.common.auth;

import com.petlifelog.backend.common.auth.dto.TokenResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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

/**
 * [인증 관련 API 컨트롤러]
 * 로그인 외의 인증 작업(토큰 재발급, 로그아웃)을 담당합니다.
 */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * [토큰 재발급 API]
     * Access Token이 만료되었을 때, 쿠키에 담긴 Refresh Token을 확인하여 새 토큰들을 발급해줍니다.
     */
    @PostMapping("/reissue")
    public ResponseEntity<Void> reissue(HttpServletRequest request, HttpServletResponse response) {
        // 1. 요청 쿠키에서 'refreshToken'을 꺼냅니다.
        String refreshToken = extractCookie(request, "refreshToken");
        if (refreshToken == null) {
            return ResponseEntity.status(401).build(); // 리프레시 토큰이 없으면 탈락!
        }

        // 2. 서비스 로직을 통해 새 토큰들을 생성합니다. (검증 포함)
        TokenResponse tokenResponse = authService.reissue(refreshToken);
        
        // 3. 새로 만든 토큰들을 다시 쿠키에 구워서 응답에 실어 보냅니다. (기존 쿠키 덮어쓰기)
        addCookie(response, "accessToken", tokenResponse.getAccessToken(), (int) Duration.ofHours(24).toSeconds());
        addCookie(response, "refreshToken", tokenResponse.getRefreshToken(), (int) Duration.ofDays(14).toSeconds());
        
        return ResponseEntity.ok().build();
    }

    /**
     * [로그아웃 API]
     * 서버에서는 유저의 리프레시 토큰 정보를 지우고, 브라우저의 쿠키도 삭제합니다.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal User user, HttpServletResponse response) {
        // 1. DB에서 해당 유저의 리프레시 토큰 해시값을 지웁니다.
        authService.logout(user.getUsername());
        
        // 2. 브라우저에 저장된 쿠키를 삭제하라고 명령합니다.
        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");
        
        return ResponseEntity.ok().build();
    }

    /**
     * [쿠키 추출 도구]
     */
    private String extractCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    /**
     * [쿠키 추가 도구]
     */
    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false) // HTTPS 환경에서는 true
                .path("/")
                .maxAge(maxAge)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * [쿠키 삭제 도구]
     * 만료 시간을 0으로 설정하면 브라우저가 즉시 쿠키를 삭제합니다.
     */
    private void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0) // 0초 뒤 만료 = 삭제
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
