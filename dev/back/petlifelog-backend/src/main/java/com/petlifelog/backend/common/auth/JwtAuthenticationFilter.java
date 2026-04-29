package com.petlifelog.backend.common.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// 모든 요청(Request)이 들어올 때 딱 한 번씩(OncePerRequest) 실행되는 필터입니다.
// 클라이언트가 헤더에 담아 보낸 JWT 토큰을 꺼내서 "이 사람 로그인한 사람 맞아?"라고 확인하는 곳입니다.
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider; // 토큰을 검증할 도구

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // 1. HTTP 요청 헤더에서 JWT 토큰을 추출합니다.
        String token = resolveToken(request);

        // 2. 토큰이 존재하고, 유효한지(가짜가 아닌지, 만료되지 않았는지) 확인합니다.
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            // 3. 토큰이 유효하면 토큰에서 '사용자 정보'를 꺼내옵니다.
            Authentication authentication = jwtTokenProvider.getAuthentication(token);
            // 4. 스프링 시큐리티의 '인증 보관소(SecurityContext)'에 이 사용자를 등록합니다.
            // 이렇게 등록해두면 이후의 컨트롤러나 서비스에서 "지금 누가 로그인했지?"라고 물어볼 수 있습니다.
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 5. 다음 필터로 요청을 넘깁니다. (로그인이 안 됐더라도 다음 단계로 보냅니다. 권한 없으면 나중에 막힙니다.)
        filterChain.doFilter(request, response);
    }

    // HTTP 요청 헤더에서 "Authorization: Bearer <토큰>" 형태의 토큰을 꺼내는 메서드입니다.
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization"); // 헤더에서 Authorization 값을 읽음
        // 값이 있고, "Bearer "로 시작한다면 그 뒤의 토큰 문자열만 잘라서 리턴합니다.
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " 가 7글자이므로 그 이후부터 끝까지
        }
        return null;
    }
}
