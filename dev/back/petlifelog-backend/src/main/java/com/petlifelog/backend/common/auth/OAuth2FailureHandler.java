package com.petlifelog.backend.common.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

// 카카오 로그인 도중 에러가 발생했을 때(예: 사용자가 취소했거나 설정 오류 등) 실행됩니다.
@Slf4j
@RequiredArgsConstructor
@Component
public class OAuth2FailureHandler implements AuthenticationFailureHandler {

    private final ObjectMapper objectMapper; // 객체를 JSON 문자열로 바꿔주는 도구

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.error("카카오 OAuth2 로그인 실패: {}", exception.getMessage(), exception);

        // 1. 응답 상태를 401(Unauthorized)로 설정합니다.
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        // 2. 응답 데이터 형식을 JSON으로 설정합니다.
        response.setContentType("application/json;charset=UTF-8");
        // 3. 에러 메시지를 JSON 형태로 만들어서 프론트엔드에 돌려줍니다.
        response.getWriter().write(objectMapper.writeValueAsString(
                Map.of("error", "OAuth2 로그인 실패", "message", exception.getMessage())
        ));
    }
}
