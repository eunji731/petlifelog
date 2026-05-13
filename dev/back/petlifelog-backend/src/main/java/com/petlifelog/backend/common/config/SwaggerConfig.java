package com.petlifelog.backend.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * [Swagger / OpenAPI 3.0 설정]
 *
 * 접속 주소: http://localhost:8080/swagger-ui/index.html
 *
 * ▶ 인증 방법 (Swagger UI에서 API 테스트 시)
 *   1. 브라우저에서 로그인(카카오 OAuth)을 먼저 완료하면 accessToken 쿠키가 자동으로 심어집니다.
 *   2. 같은 브라우저에서 Swagger UI를 열면 쿠키가 함께 전송되므로 별도 토큰 입력 없이 "Try it out" 가능합니다.
 *   3. 또는 우측 상단 [Authorize] 버튼 → "cookieAuth" → 발급받은 accessToken 값을 직접 입력하세요.
 *
 * ▶ Rate Limit 주의
 *   - /api/ai/analyze : 날짜별 2회 / 하루 10회 제한
 *   - /api/dashboard/ai-report/refresh : 하루 3회 제한
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        // ── 쿠키 기반 인증 스키마 정의 ─────────────────────────────
        // 우리 앱은 accessToken을 HttpOnly 쿠키로 관리합니다.
        // Swagger UI에서 "Authorize" 버튼을 클릭하면 이 스키마가 표시됩니다.
        SecurityScheme cookieAuth = new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.COOKIE)
                .name("accessToken")
                .description("카카오 로그인 후 발급받은 accessToken 쿠키 값. " +
                        "같은 브라우저에서 로그인 후 Swagger에 접근하면 자동으로 포함됩니다.");

        // 전체 API에 쿠키 인증을 기본으로 요구합니다.
        SecurityRequirement securityRequirement = new SecurityRequirement().addList("cookieAuth");

        return new OpenAPI()
                .info(new Info()
                        .title("PetLifeLog API")
                        .description("""
                                ## 반려동물 일상 기록 서비스 API

                                ### 서비스 개요
                                사진을 업로드하면 Google Gemini AI가 반려동물 일기를 자동으로 작성해주는 서비스입니다.

                                ### 인증 방식
                                - **카카오 OAuth2 소셜 로그인** 사용
                                - 로그인 성공 시 `accessToken` (24h) + `refreshToken` (14d) 쿠키가 발급됩니다.
                                - 모든 API는 `accessToken` 쿠키가 필요합니다. (일부 공개 API 제외)
                                - Access Token 만료 시 `/api/auth/reissue`로 갱신하세요.

                                ### 파일 접근
                                - 이미지 파일: `GET /files/{storedPath}` 또는 `GET /uploads/{path}`
                                - 인증 없이 접근 가능 (경로에 UUID가 포함되어 추측 불가)

                                ### AI 사용 제한
                                | API | 제한 |
                                |-----|------|
                                | 일기 분석 (`/api/ai/analyze`) | 날짜별 2회 / 하루 10회 |
                                | 대시보드 리포트 갱신 | 하루 3회 |
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("PetLifeLog Team")
                                .email("ohohdmswlgd@gmail.com")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("로컬 개발 서버")
                ))
                .components(new Components()
                        .addSecuritySchemes("cookieAuth", cookieAuth))
                .addSecurityItem(securityRequirement);
    }
}
