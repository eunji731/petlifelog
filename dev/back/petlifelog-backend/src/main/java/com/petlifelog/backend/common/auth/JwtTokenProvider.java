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

// JWT 토큰의 생성, 복호화(해독), 유효성 검증을 담당하는 클래스입니다.
@Component
public class JwtTokenProvider {

    // application.yml에 정의된 비밀키와 만료시간을 가져옵니다.
    @Value("${jwt.secret}")
    private String secretKeyPlain; // 외부에 노출되면 안 되는 아주 중요한 키입니다.

    @Value("${jwt.expiration}")
    private long accessTokenValidityInMilliseconds; // Access Token 유효시간 (보통 짧음, 예: 1시간)

    // Refresh Token 유효시간 (길게 설정, 예: 14일)
    private final long refreshTokenValidityInMilliseconds = 14 * 24 * 60 * 60 * 1000L;

    private SecretKey secretKey; // 실제 암호화에 사용할 키 객체

    // 객체 생성 후 딱 한 번 실행되어 암호 키를 초기화합니다.
    @PostConstruct
    protected void init() {
        // 평문 비밀키를 HMAC SHA 알고리즘에 적합한 SecretKey 객체로 변환합니다.
        this.secretKey = Keys.hmacShaKeyFor(secretKeyPlain.getBytes(StandardCharsets.UTF_8));
    }

    // Access Token을 생성합니다. (API 호출 시 사용)
    public String createAccessToken(String userId, String role) {
        return createToken(userId, role, accessTokenValidityInMilliseconds);
    }

    // Refresh Token을 생성합니다. (Access Token 만료 시 재발급용)
    public String createRefreshToken(String userId, String role) {
        return createToken(userId, role, refreshTokenValidityInMilliseconds);
    }

    // 실제 토큰을 조립하는 핵심 로직입니다.
    private String createToken(String userId, String role, long validity) {
        // 1. Claims: 토큰 안에 담을 정보 조각들입니다.
        Claims claims = Jwts.claims()
                .subject(userId) // 사용자의 고유 ID (PK)를 제목(Subject)으로 넣습니다.
                .add("role", role) // 사용자의 권한(USER, ADMIN 등)을 추가 정보로 넣습니다.
                .build();

        Date now = new Date();
        Date validityDate = new Date(now.getTime() + validity); // 현재 시각 + 유효시간 = 만료시각

        // 2. JWT 빌더를 이용해 최종적인 토큰 문자열을 만듭니다.
        return Jwts.builder()
                .claims(claims) // 위에서 만든 정보 조각들
                .issuedAt(now) // 발행 시각
                .expiration(validityDate) // 만료 시각
                .signWith(secretKey) // 비밀키로 서명 (나중에 위조 방지용)
                .compact(); // 압축해서 문자열로 리턴
    }

    // 토큰에서 정보를 꺼내어 스프링 시큐리티의 'Authentication(인증 객체)'으로 변환합니다.
    public Authentication getAuthentication(String token) {
        // 1. 토큰을 해독(Parse)하여 내용을 꺼냅니다.
        Claims claims = Jwts.parser()
                .verifyWith(secretKey) // 비밀키로 검증 시도
                .build()
                .parseSignedClaims(token) // 서명이 맞는지 확인하며 내용 읽기
                .getPayload(); // 실제 데이터 뭉치(Payload) 가져오기

        // 2. 토큰에 담긴 "role" 정보를 꺼내서 스프링 시큐리티 권한 객체로 만듭니다.
        Collection<? extends GrantedAuthority> authorities =
                Arrays.stream(claims.get("role").toString().split(","))
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

        // 3. User 객체 생성 (사용자 ID, 비번은 빈값, 권한)
        User principal = new User(claims.getSubject(), "", authorities);

        // 4. 인증 토큰 객체를 만들어 리턴합니다. (시큐리티가 이해할 수 있는 형태)
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }

    // 토큰이 유효한지 검사합니다. (위조 여부, 만료 여부 등)
    public boolean validateToken(String token) {
        try {
            // 토큰을 해독해봅니다. 문제가 있다면 예외(Exception)가 발생합니다.
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true; // 아무 문제 없으면 true
        } catch (Exception e) {
            // 서명이 틀렸거나, 만료됐거나, 형식이 잘못됐으면 false
            return false;
        }
    }

    // 토큰에서 사용자 ID만 쏙 빼내는 기능입니다.
    public String getUserId(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject(); // 아까 넣었던 userId(Subject)를 가져옴
    }
}
