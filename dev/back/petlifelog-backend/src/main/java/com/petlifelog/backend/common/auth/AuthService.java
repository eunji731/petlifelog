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

/**
 * [인증 서비스 로직]
 * 토큰 재발급, 로그아웃 등 실제 비즈니스 로직이 수행되는 곳입니다.
 */
@RequiredArgsConstructor
@Service
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final MemberRepository memberRepository;

    /**
     * [토큰 재발급 로직]
     * 사용자가 보낸 Refresh Token이 정당한지 확인하고, 새 토큰 세트를 발급합니다.
     */
    @Transactional
    public TokenResponse reissue(String refreshToken) {
        // 1. Refresh Token 자체가 가짜가 아닌지, 만료되지 않았는지 먼저 확인합니다.
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // 2. 토큰 안에서 사용자의 ID(UUID)를 꺼냅니다.
        String userId = jwtTokenProvider.getUserId(refreshToken);
        
        // 3. 그 ID로 우리 DB에 실제 회원이 있는지 찾습니다.
        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 4. [매우 중요 보안 단계] 사용자가 보낸 토큰의 해시값과 DB에 저장된 해시값이 일치하는지 비교합니다.
        // 만약 해커가 옛날 토큰을 훔쳐왔다면, DB의 최신 값과 달라서 여기서 걸러집니다.
        if (member.getRefreshTokenHash() == null ||
            !sha256(refreshToken).equals(member.getRefreshTokenHash())) {
            throw new IllegalArgumentException("토큰 정보가 일치하지 않습니다. 다시 로그인해주세요.");
        }

        // 5. [Token Rotation] 기존 토큰은 버리고, 새 Access Token과 새 Refresh Token을 만듭니다.
        // 이렇게 매번 새로 발급하면 보안성이 훨씬 높아집니다.
        String newAccessToken = jwtTokenProvider.createAccessToken(member.getId().toString(), member.getRole());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(member.getId().toString(), member.getRole());

        // 6. DB에 새로 발급한 Refresh Token의 해시값을 업데이트합니다.
        member.updateRefreshToken(sha256(newRefreshToken));

        // 7. 새로 만든 토큰 2개를 응답 데이터(DTO)에 담아서 리턴합니다.
        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .build();
    }

    /**
     * [SHA-256 암호화]
     * 토큰 원본을 그대로 DB에 저장하면 위험하므로, 알아볼 수 없는 해시값으로 바꿔서 저장합니다.
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

    /**
     * [로그아웃 로직]
     * 서버에서는 해당 유저의 Refresh Token 정보를 지워서 더 이상 토큰 재발급이 안 되게 만듭니다.
     */
    @Transactional
    public void logout(String userId) {
        // 1. 로그아웃하려는 유저를 찾습니다.
        Member member = memberRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 2. DB에 저장된 Refresh Token 해시값을 NULL로 만듭니다 (무효화).
        member.invalidateToken();
    }
}
