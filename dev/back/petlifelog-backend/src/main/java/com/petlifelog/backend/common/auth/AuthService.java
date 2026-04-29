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

// 실제 인증 관련 핵심 로직이 들어있는 서비스입니다.
@RequiredArgsConstructor
@Service
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider; // 토큰 도구
    private final MemberRepository memberRepository; // DB 연동

    // [토큰 재발급 로직]
    @Transactional
    public TokenResponse reissue(String refreshToken) {
        // 1. Refresh Token 자체가 진짜인지, 만료되지는 않았는지 먼저 확인합니다.
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // 2. 토큰 안에서 사용자 ID(UUID)를 꺼냅니다.
        String userId = jwtTokenProvider.getUserId(refreshToken);
        // 3. 그 ID로 DB에서 회원을 찾습니다.
        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 4. [보안 핵심] 사용자가 보낸 Refresh Token의 해시값과 DB에 저장된 해시값이 일치하는지 비교합니다.
        // 만약 다르다면, 누군가 예전 토큰을 가로챘거나 잘못된 접근일 수 있습니다.
        if (member.getRefreshTokenHash() == null ||
            !sha256(refreshToken).equals(member.getRefreshTokenHash())) {
            throw new IllegalArgumentException("토큰 정보가 일치하지 않습니다.");
        }

        // 5. [Token Rotation 전략] 기존 Refresh Token은 무효화하고 새 Access/Refresh 토큰 쌍을 만듭니다.
        // 이렇게 하면 토큰이 탈취되더라도 금방 무효화되어 안전합니다.
        String newAccessToken = jwtTokenProvider.createAccessToken(member.getId().toString(), member.getRole().getKey());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(member.getId().toString(), member.getRole().getKey());

        // 6. DB에 새로 발급한 Refresh Token의 해시값을 업데이트합니다.
        member.updateRefreshToken(sha256(newRefreshToken));

        // 7. 새로 만든 토큰 2개를 응답 데이터로 보냅니다.
        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    // SHA-256 암호화 메서드 (보안을 위해 Refresh Token 원본 대신 해시값을 저장하기 위함)
    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 알고리즘을 사용할 수 없습니다.", e);
        }
    }

    // [로그아웃 로직]
    @Transactional
    public void logout(String userId) {
        // 1. 로그아웃하려는 회원을 찾습니다.
        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 2. DB에 저장된 Refresh Token 해시값을 지워버립니다(NULL).
        // 이렇게 하면 이후에 이 사용자가 예전 Refresh Token을 가져와도 재발급이 안 되어 로그아웃 효과가 나타납니다.
        member.invalidateToken();
    }
}
