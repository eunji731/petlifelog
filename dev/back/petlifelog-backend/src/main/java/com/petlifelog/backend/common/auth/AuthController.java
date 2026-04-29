package com.petlifelog.backend.common.auth;

import com.petlifelog.backend.common.auth.dto.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// 인증 관련 API를 담당하는 컨트롤러입니다. (토큰 재발급, 로그아웃 등)
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth") // 공통 주소: http://서버/api/auth
public class AuthController {

    private final AuthService authService; // 실제 비즈니스 로직을 처리하는 서비스

    // 1. 토큰 재발급 API
    // 프론트엔드가 가진 Access Token이 만료됐을 때, Refresh Token을 보내서 새 토큰을 받아갑니다.
    @PostMapping("/reissue")
    public ResponseEntity<TokenResponse> reissue(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken"); // 보낸 데이터에서 refreshToken 꺼내기
        // 새 토큰 묶음(Access/Refresh)을 리턴합니다.
        return ResponseEntity.ok(authService.reissue(refreshToken));
    }

    // 2. 로그아웃 API
    // @AuthenticationPrincipal User user : 현재 로그인한 사용자의 정보를 스프링 시큐리티에서 꺼내옵니다.
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal User user) {
        // 사용자의 username(우리는 UUID를 넣었죠)을 이용해 로그아웃 처리를 합니다.
        authService.logout(user.getUsername());
        return ResponseEntity.ok().build(); // 성공 응답 전송
    }
}
