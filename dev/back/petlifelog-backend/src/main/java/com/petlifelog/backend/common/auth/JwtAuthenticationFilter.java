package com.petlifelog.backend.common.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

/**
 * [JWT 인증 필터]
 * 모든 API 요청이 들어올 때마다 가장 먼저 거치는 '검문소'입니다.
 * 브라우저가 자동으로 보내준 쿠키에서 신분증(JWT)을 꺼내서 확인하는 작업을 합니다.
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // 1. 요청 정보(쿠키 등)에서 Access Token을 꺼내옵니다.
        String token = resolveToken(request);

        // 2. 토큰이 존재하고, 그 토큰이 유효한지(진짜인지, 만료 안 됐는지) 검사합니다.
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            // 3. 토큰이 정상이면, 토큰 안에 적힌 유저 정보로 '인증 객체'를 만듭니다.
            Authentication authentication = jwtTokenProvider.getAuthentication(token);
            
            // 4. [중요] 스프링 시큐리티의 '보안 보관함(SecurityContext)'에 이 유저를 넣어둡니다.
            // 이렇게 해두면 이후의 컨트롤러나 서비스에서 "지금 로그인한 사람 누구야?"라고 물어볼 수 있습니다.
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 5. 다음 단계(다른 필터나 실제 컨트롤러)로 요청을 넘깁니다.
        filterChain.doFilter(request, response);
    }

    /**
     * [쿠키에서 토큰 꺼내기]
     * 브라우저가 자동으로 실어 보낸 쿠키들 중에서 'accessToken'이라는 이름의 쿠키를 찾습니다.
     */
    private String resolveToken(HttpServletRequest request) {
        // HttpOnly 쿠키에서 accessToken 읽기
        if (request.getCookies() != null) {
            return Arrays.stream(request.getCookies())
                    .filter(c -> "accessToken".equals(c.getName())) // 이름이 'accessToken'인 쿠키 찾기
                    .map(Cookie::getValue) // 그 쿠키의 실제 값(JWT 문자열) 가져오기
                    .findFirst()
                    .orElse(null);
        }
        return null;
    }
}
