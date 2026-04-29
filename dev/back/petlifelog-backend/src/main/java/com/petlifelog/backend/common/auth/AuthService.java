package com.petlifelog.backend.common.auth;

import com.petlifelog.backend.common.auth.dto.TokenResponse;
import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final MemberRepository memberRepository;

    @Transactional
    public TokenResponse reissue(String refreshToken) {
        // 1. Refresh Token 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // 2. 토큰에서 User ID 추출
        String userId = jwtTokenProvider.getUserId(refreshToken);
        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 3. DB의 해시값과 비교
        if (member.getRefreshTokenHash() == null ||
            !sha256(refreshToken).equals(member.getRefreshTokenHash())) {
            throw new IllegalArgumentException("토큰 정보가 일치하지 않습니다.");
        }

        // 4. 새로운 토큰 쌍 발급 (Rotation 전략)
        String newAccessToken = jwtTokenProvider.createAccessToken(member.getId().toString(), member.getRole().getKey());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(member.getId().toString(), member.getRole().getKey());

        // 5. DB 업데이트 (신규 해시 저장 및 발급 시각 갱신)
        member.updateRefreshToken(sha256(newRefreshToken));

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
        }
    }

    @Transactional
    public void logout(String userId) {
        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 설계서 명세: refresh_token_hash = NULL + token_issued_at 갱신
        member.invalidateToken();
    }
}
