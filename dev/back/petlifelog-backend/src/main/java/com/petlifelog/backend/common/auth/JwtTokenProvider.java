package com.petlifelog.backend.common.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

/**
 * [JWT 토큰 관리자]
 * JWT(JSON Web Token)는 디지털 신분증이라고 생각하면 됩니다.
 * 이 클래스는 신분증을 발급하고(생성), 위조됐는지 확인하고(검증), 신분증 내용을 읽는 역할을 합니다.
 */
@Component
public class JwtTokenProvider {

    // application.yml 파일에 설정한 비밀키와 만료시간을 가져옵니다.
    @Value("${jwt.secret}")
    private String secretKeyPlain; // 이 키는 절대 외부에 노출되면 안 됩니다! (금고 열쇠 같은 것)

    @Value("${jwt.expiration}")
    private long accessTokenValidityInMilliseconds; // Access Token 유효시간 (보통 짧게 설정, 예: 1시간)

    // Refresh Token 유효시간 (보통 길게 설정, 예: 14일)
    // Access Token이 만료됐을 때 다시 발급받기 위한 용도입니다.
    private final long refreshTokenValidityInMilliseconds = 14 * 24 * 60 * 60 * 1000L;

    private SecretKey secretKey; // 실제 암호화 로직에 사용할 키 객체

    /**
     * [키 초기화]
     * 객체가 생성된 후, 평문으로 된 비밀키를 암호화 알고리즘에 쓸 수 있는 객체로 변환합니다.
     */
    @PostConstruct
    protected void init() {
        this.secretKey = Keys.hmacShaKeyFor(secretKeyPlain.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * [Access Token 생성]
     * 실제 API를 호출할 때 들고 다녀야 하는 짧은 유효시간의 신분증을 만듭니다.
     */
    public String createAccessToken(String userId, String role) {
        return createToken(userId, role, accessTokenValidityInMilliseconds);
    }

    /**
     * [Refresh Token 생성]
     * Access Token이 만료됐을 때 새 토큰을 받기 위한 긴 유효시간의 신분증을 만듭니다.
     */
    public String createRefreshToken(String userId, String role) {
        return createToken(userId, role, refreshTokenValidityInMilliseconds);
    }

    /**
     * [토큰 조립 로직]
     * 실제 JWT 문자열을 만드는 핵심 부분입니다.
     */
    private String createToken(String userId, String role, long validity) {
        // Claims: 토큰 안에 담을 정보 조각들 (누구인지, 권한이 무엇인지 등)
        Claims claims = Jwts.claims()
                .subject(userId) // 사용자의 고유 ID (예: UUID)를 '제목'으로 넣습니다.
                .add("role", role) // 사용자의 권한(USER 등)을 추가 정보로 넣습니다.
                .build();

        Date now = new Date();
        Date validityDate = new Date(now.getTime() + validity); // 현재 시각 + 유효시간 = 만료 시각

        // JWT 빌더를 이용해 토큰을 최종적으로 완성합니다.
        return Jwts.builder()
                .claims(claims) // 데이터 담기
                .issuedAt(now) // 언제 발급했는지
                .expiration(validityDate) // 언제까지 유효한지
                .signWith(secretKey) // 위조를 막기 위해 비밀키로 서명(Signature)을 합니다.
                .compact(); // 모든 정보를 압축해서 하나의 문자열로 만듭니다.
    }

    /**
     * [신분증 확인 및 인증 객체 생성]
     * 토큰(신분증)을 받아서 그 안에 적힌 정보로 스프링 시큐리티가 이해할 수 있는 '인증 객체'를 만듭니다.
     */
    public Authentication getAuthentication(String token) {
        // 1. 토큰을 해독(Parse)하여 내용을 꺼냅니다. (서명이 다르면 여기서 에러 남)
        Claims claims = Jwts.parser()
                .verifyWith(secretKey) // 우리가 가진 비밀키로 검증
                .build()
                .parseSignedClaims(token)
                .getPayload();

        // 2. 토큰에 적힌 권한 정보를 꺼냅니다. (ROLE_USER 등)
        Collection<? extends GrantedAuthority> authorities =
                Arrays.stream(claims.get("role").toString().split(","))
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

        // 3. 스프링 시큐리티 내부에서 사용할 유저 객체를 만듭니다.
        User principal = new User(claims.getSubject(), "", authorities);

        // 4. "이 유저는 인증된 유저다"라는 정보를 담은 객체를 리턴합니다.
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }

    /**
     * [토큰 유효성 검사]
     * 이 토큰이 진짜인지, 만료되지는 않았는지를 확인합니다.
     */
    public boolean validateToken(String token) {
        try {
            // 토큰을 해독해봅니다. 문제가 있다면(위조, 만료 등) catch 블록으로 넘어갑니다.
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true; // 아무 문제 없으면 진짜!
        } catch (Exception e) {
            // 문제가 있으면 가짜!
            return false;
        }
    }

    /**
     * [사용자 ID 추출]
     * 토큰 안에 적힌 사용자 고유 ID(Subject)를 꺼내옵니다.
     */
    public String getUserId(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 재가입 확인용 단기 토큰 (10분)
    public String createRejoinToken(String memberId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(memberId)
                .claim("type", "rejoin")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 10 * 60 * 1000L))
                .signWith(secretKey)
                .compact();
    }

    public boolean isRejoinToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(secretKey).build()
                    .parseSignedClaims(token).getPayload();
            return "rejoin".equals(claims.get("type"));
        } catch (Exception e) {
            return false;
        }
    }
}
