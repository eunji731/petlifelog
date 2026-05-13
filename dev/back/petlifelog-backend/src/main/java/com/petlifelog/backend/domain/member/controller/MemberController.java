package com.petlifelog.backend.domain.member.controller;

import com.petlifelog.backend.common.auth.JwtTokenProvider;
import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.member.domain.Member;
import com.petlifelog.backend.domain.member.repository.MemberRepository;
import com.petlifelog.backend.domain.member.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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

/**
 * [회원 관리 컨트롤러]
 *
 * 로그인한 사용자의 프로필 조회·수정, 회원 탈퇴, 재가입을 처리합니다.
 * 카카오 로그인 자체는 Spring Security OAuth2가 처리하므로 여기엔 없습니다.
 *
 * ▶ 주요 엔드포인트
 *   GET    /api/members/me           → 내 프로필 조회
 *   PUT    /api/members/me/ai-context → AI 개인화 설정 수정
 *   DELETE /api/members/me           → 회원 탈퇴 (소프트 삭제)
 *   POST   /api/members/rejoin       → 탈퇴 후 재가입
 */
@Tag(name = "회원", description = "로그인 사용자의 프로필 조회/수정, 탈퇴, 재가입 API")
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.expiration}")
    private long accessTokenExpiry;

    // ─────────────────────────────────────────────────────────────
    // 내 프로필 조회
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "내 프로필 조회",
        description = """
            현재 로그인한 사용자의 닉네임과 AI 개인화 컨텍스트를 반환합니다.

            **응답 예시:**
            ```json
            {
              "nickname": "쿠키맘",
              "aiContext": "우리 강아지는 산책을 매우 좋아하고 공놀이를 즐깁니다."
            }
            ```

            `aiContext`는 AI 일기 생성 시 반영되는 보호자 개인 설명입니다. 없으면 빈 문자열("")이 반환됩니다.
            """
    )
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe(@AuthenticationPrincipal User user) {
        Member member = memberRepository.findById(UUID.fromString(user.getUsername()))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "nickname", member.getNickname(),
                "aiContext", member.getAiContext() != null ? member.getAiContext() : ""
        )));
    }

    // ─────────────────────────────────────────────────────────────
    // AI 컨텍스트 수정
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "AI 개인화 설정 수정",
        description = """
            AI 일기 생성 시 반영될 보호자 개인 설명(aiContext)을 수정합니다.

            이 내용은 Gemini AI 프롬프트 앞에 추가되어 더 맞춤화된 일기를 생성하는 데 활용됩니다.

            **요청 Body:**
            ```json
            {
              "aiContext": "우리 강아지는 호기심이 많고 낯선 사람을 좋아해요. 간식은 닭가슴살을 제일 좋아합니다."
            }
            ```

            **팁:** 반려동물의 성격, 좋아하는 것, 특이사항 등을 적어두면 AI 일기 품질이 올라갑니다.
            """
    )
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

    // ─────────────────────────────────────────────────────────────
    // 회원 탈퇴
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "회원 탈퇴",
        description = """
            현재 로그인한 계정을 탈퇴 처리합니다. **소프트 삭제** 방식으로, 실제 데이터는 유지됩니다.

            **처리 내용:**
            1. 회원 `isActive = false` 설정
            2. 반려동물들도 `isActive = false` 설정 (반려동물 숨김)
            3. 브라우저 쿠키(accessToken, refreshToken) 즉시 삭제

            **재가입:** 탈퇴 후 30일 이내에 `/api/members/rejoin`으로 계정을 복구할 수 있습니다.
            (재가입 토큰은 탈퇴 처리 후 이메일/별도 경로로 받습니다)
            """
    )
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> withdraw(@AuthenticationPrincipal User user,
                                                       HttpServletResponse response) {
        memberService.withdraw(UUID.fromString(user.getUsername()));
        // 탈퇴 후 쿠키를 즉시 삭제하여 자동 로그아웃 처리
        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");
        return ResponseEntity.ok(ApiResponse.success());
    }

    // ─────────────────────────────────────────────────────────────
    // 재가입
    // ─────────────────────────────────────────────────────────────

    @Operation(
        summary = "탈퇴 후 재가입 (계정 복구)",
        description = """
            탈퇴한 계정을 복구합니다. **인증 불필요** (공개 API)

            **요청 Body:**
            ```json
            {
              "token": "재가입용-JWT-토큰"
            }
            ```

            **처리 내용:**
            1. 재가입 토큰 유효성 검증 (별도 발급 토큰, 일반 accessToken과 다름)
            2. 회원 `isActive = true` 복구
            3. 반려동물들도 `isActive = true` 복구
            4. 새 accessToken + refreshToken 쿠키 발급 (자동 로그인)

            **응답:** 성공 시 새 토큰 쿠키가 Set-Cookie 헤더로 전달됩니다.
            """
    )
    @PostMapping("/rejoin")
    public ResponseEntity<ApiResponse<Void>> rejoin(@RequestBody Map<String, String> body,
                                                     HttpServletResponse response) {
        Member member = memberService.rejoin(body.get("token"));

        // 재가입 성공 → 새 토큰을 발급하여 자동 로그인 처리
        String accessToken = jwtTokenProvider.createAccessToken(member.getId().toString(), member.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(member.getId().toString(), member.getRole());
        member.updateRefreshToken(sha256(refreshToken));
        memberRepository.save(member);

        addCookie(response, "accessToken", accessToken, (int) Duration.ofHours(24).toSeconds());
        addCookie(response, "refreshToken", refreshToken, (int) Duration.ofDays(14).toSeconds());

        return ResponseEntity.ok(ApiResponse.success());
    }

    // ─────────────────────────────────────────────────────────────
    // 내부 유틸 메서드
    // ─────────────────────────────────────────────────────────────

    /** HttpOnly 쿠키를 응답에 추가합니다. SameSite=Lax로 CSRF 방어. */
    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true).secure(false).path("/").maxAge(maxAge).sameSite("Lax").build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /** 쿠키를 삭제합니다. maxAge=0 으로 설정하면 브라우저가 즉시 삭제. */
    private void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = ResponseCookie.from(name, "")
                .httpOnly(true).secure(false).path("/").maxAge(0).sameSite("Lax").build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /** Refresh Token을 DB에 저장하기 위해 SHA-256 해시로 변환합니다. 원본 토큰이 유출되어도 DB만으로는 복원 불가. */
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
