package com.petlifelog.backend.common.auth;

import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;

/**
 * [OAuth2 로그인 성공 핸들러]
 * 카카오 로그인이 무사히 완료되면 실행되는 클래스입니다.
 * 여기서 JWT 토큰을 만들고, 브라우저의 'HttpOnly 쿠키'에 담아서 보내줍니다.
 */
@Slf4j
@RequiredArgsConstructor
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final MemberRepository memberRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl; // 로그인 완료 후 돌아갈 프론트엔드 주소 (예: localhost:3000)

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        // 1. 카카오에서 준 유저 정보 꺼내기
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        Long kakaoId = ((Number) attributes.get("id")).longValue();
        log.info("OAuth2 로그인 성공 - kakaoId: {}", kakaoId);

        // 2. DB에서 해당 유저 찾기
        Member member = memberRepository.findByKakaoId(kakaoId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 3. 우리 서버용 Access Token과 Refresh Token 만들기
        String accessToken = jwtTokenProvider.createAccessToken(member.getId().toString(), member.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(member.getId().toString(), member.getRole());

        // 4. [보안] Refresh Token은 보안을 위해 SHA-256으로 암호화(해싱)해서 DB에 저장합니다.
        // 나중에 사용자가 토큰을 가져오면 다시 해싱해서 DB값과 비교합니다.
        member.updateRefreshToken(sha256(refreshToken));
        memberRepository.save(member);

        // 5. [핵심] HttpOnly 쿠키에 토큰 담기
        // 과거에는 헤더에 담아 보냈지만, 이제는 브라우저가 자동으로 관리하는 쿠키에 담습니다.
        // HttpOnly: 자바스크립트로 쿠키를 못 읽게 막아서 해킹(XSS)으로부터 안전하게 보호합니다.
        addCookie(response, "accessToken", accessToken, (int) Duration.ofHours(24).toSeconds());
        addCookie(response, "refreshToken", refreshToken, (int) Duration.ofDays(14).toSeconds());

        // 6. 모든 준비가 끝났으니 프론트엔드 홈 화면으로 리다이렉트(이동) 시킵니다.
        // 이제 프론트엔드는 토큰을 따로 저장할 필요가 없습니다. 브라우저가 쿠키를 알아서 들고 다닙니다.
        getRedirectStrategy().sendRedirect(request, response, frontendUrl);
    }

    /**
     * [쿠키를 생성해서 응답에 추가하는 메서드]
     */
    private void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true) // 자바스크립트 접근 차단 (보안!)
                .secure(false) // HTTPS 환경에서만 전송할지 여부 (로컬 개발 시 false, 배포 시 true 권장)
                .path("/") // 모든 주소에서 이 쿠키를 사용할 수 있게 함
                .maxAge(maxAge) // 쿠키 유효 기간
                .sameSite("Lax") // [CSRF 방어] 타 도메인에서 오는 POST/PUT/DELETE 요청에는 쿠키를 전송하지 않도록 브라우저에게 지시합니다.
                                  // 이 설정 덕분에 Spring의 CSRF 토큰 없이도 CSRF 공격을 막을 수 있습니다.
                .build();
        
        // HTTP 응답 헤더에 'Set-Cookie'라는 이름으로 쿠키 정보를 싣습니다.
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    /**
     * [SHA-256 암호화 도구]
     * 글자를 알아볼 수 없는 외계어로 바꿔주는 함수입니다. (복호화 불가능)
     */
    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
        }
    }
}
