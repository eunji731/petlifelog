package com.petlifelog.backend.domain.member;

import com.petlifelog.backend.common.auth.JwtTokenProvider;
import com.petlifelog.backend.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.expiration}")
    private long accessTokenExpiry;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe(@AuthenticationPrincipal User user) {
        Member member = memberRepository.findById(UUID.fromString(user.getUsername()))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "nickname", member.getNickname(),
                "aiContext", member.getAiContext() != null ? member.getAiContext() : ""
        )));
    }

    @PutMapping("/me/ai-context")
    public ResponseEntity<ApiResponse<Void>> updateAiContext(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        Member member = memberRepository.findById(UUID.fromString(user.getUsername()))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        member.updateAiContext(body.get("aiContext"));
        memberRepository.save(member);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(@AuthenticationPrincipal User user,
                                                       HttpServletResponse response) {
        memberService.withdraw(UUID.fromString(user.getUsername()));
        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/rejoin")
    public ResponseEntity<ApiResponse<Void>> rejoin(@RequestBody Map<String, String> body,
                                                     HttpServletResponse response) {
        Member member = memberService.rejoin(body.get("token"));

        String accessToken = jwtTokenProvider.createAccessToken(member.getId().toString(), member.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(member.getId().toString(), member.getRole());
        member.updateRefreshToken(sha256(refreshToken));
        memberRepository.save(member);

        addCookie(response, "accessToken", accessToken, (int) Duration.ofHours(24).toSeconds());
        addCookie(response, "refreshToken", refreshToken, (int) Duration.ofDays(14).toSeconds());

        return ResponseEntity.ok(ApiResponse.success());
    }

    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true).secure(false).path("/").maxAge(maxAge).sameSite("Lax").build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true).secure(false).path("/").maxAge(0).sameSite("Lax").build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String sha256(String input) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
