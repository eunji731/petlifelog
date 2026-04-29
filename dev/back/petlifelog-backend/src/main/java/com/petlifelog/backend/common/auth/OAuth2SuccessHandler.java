package com.petlifelog.backend.common.auth;

import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.MemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

// 카카오 인증이 완전히 끝났을 때(성공했을 때) 실행되는 핸들러입니다.
@Slf4j
@RequiredArgsConstructor
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider; // 토큰 발급 도구
    private final MemberRepository memberRepository; // DB 연동

    @Value("${app.frontend-url}") // application.yml에 있는 프론트엔드 주소를 가져옵니다.
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        // 1. 카카오에서 준 사용자 정보를 꺼냅니다.
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 2. 카카오 고유 ID를 가져옵니다. (Integer로 올 수 있어서 Long으로 안전하게 변환)
        Long kakaoId = ((Number) attributes.get("id")).longValue();
        log.info("OAuth2 로그인 성공 - kakaoId: {}, frontendUrl: {}", kakaoId, frontendUrl);

        // 3. DB에서 이 사용자를 찾습니다. (CustomOAuth2UserService에서 이미 저장했으므로 반드시 있어야 함)
        Member member = memberRepository.findByKakaoId(kakaoId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 4. 우리 서비스에서 사용할 Access Token과 Refresh Token을 생성합니다.
        String accessToken = jwtTokenProvider.createAccessToken(member.getId().toString(), member.getRole().getKey());
        String refreshToken = jwtTokenProvider.createRefreshToken(member.getId().toString(), member.getRole().getKey());

        // 5. 보안을 위해 Refresh Token은 DB에 해시(암호화)해서 저장해둡니다.
        member.updateRefreshToken(sha256(refreshToken));
        memberRepository.save(member);

        // 6. 프론트엔드(React 등)의 콜백 주소로 토큰들을 싣고 리다이렉트합니다.
        // 주소창 뒤에 ?accessToken=...&refreshToken=... 처럼 붙여서 보냅니다.
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/kakao/callback")
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        // 7. 실제로 프론트엔드 페이지로 화면을 넘깁니다.
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    // 문자열(Refresh Token)을 SHA-256 방식으로 암호화(해시)하는 간단한 헬퍼 메서드입니다.
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
