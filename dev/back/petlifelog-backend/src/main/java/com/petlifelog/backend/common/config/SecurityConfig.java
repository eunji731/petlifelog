package com.petlifelog.backend.common.config;

import com.petlifelog.backend.common.auth.CustomOAuth2UserService;
import com.petlifelog.backend.common.auth.JwtAuthenticationFilter;
import com.petlifelog.backend.common.auth.JwtTokenProvider;
import com.petlifelog.backend.common.auth.OAuth2FailureHandler;
import com.petlifelog.backend.common.auth.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@RequiredArgsConstructor // final이 붙은 필드들을 자동으로 생성자로 만들어줍니다. (의존성 주입)
@Configuration // 이 클래스가 스프링의 설정 파일임을 나타냅니다.
@EnableWebSecurity // 스프링 시큐리티 기능을 활성화합니다.
public class SecurityConfig {

    // 우리가 만든 커스텀 클래스들을 불러옵니다.
    private final CustomOAuth2UserService customOAuth2UserService; // 카카오 사용자 정보를 처리하는 서비스
    private final OAuth2SuccessHandler oAuth2SuccessHandler; // 로그인 성공 시 실행될 로직
    private final OAuth2FailureHandler oAuth2FailureHandler; // 로그인 실패 시 실행될 로직
    private final JwtTokenProvider jwtTokenProvider; // JWT 토큰을 만들고 검증하는 도구

    // CORS(Cross-Origin Resource Sharing) 설정: 다른 도메인(예: React의 localhost:3000)에서 백엔드로 접속을 허용합니다.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000")); // 프론트엔드 주소 허용
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")); // 허용할 HTTP 메서드
        config.setAllowedHeaders(List.of("*")); // 모든 헤더 허용
        config.setAllowCredentials(true); // 쿠키나 인증 정보를 포함한 요청 허용

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // 모든 경로에 대해 위 설정을 적용
        return source;
    }

    // 스프링 시큐리티의 핵심 설정: 어떤 요청을 허용하고, 로그인은 어떻게 할지 정의합니다.
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. 위에서 만든 CORS 설정을 적용합니다.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 2. CSRF 보안을 비활성화합니다. (REST API는 Stateless하므로 보통 끕니다)
                .csrf(AbstractHttpConfigurer::disable)
                // 3. 기본 로그인 폼을 비활성화합니다. (우리는 카카오 로그인을 쓸 거니까요)
                .formLogin(AbstractHttpConfigurer::disable)
                // 4. HTTP Basic 인증(아이디/비번 직접 전송)을 비활성화합니다.
                .httpBasic(AbstractHttpConfigurer::disable)
                // 5. 세션 정책 설정: JWT를 사용하므로 세션을 만들지 않지만, OAuth2 내부 로직상 필요할 때만 생성하도록 합니다.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                // 6. URL별 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // 아래 경로들은 로그인 안 해도 들어올 수 있게 'permitAll()' 처리합니다.
                        .requestMatchers("/", "/kakao/auth-code", "/oauth2/**", "/error", "/favicon.ico").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/api/auth/reissue").permitAll() // 토큰 재발급은 로그인 체크 제외
                        // 그 외 모든 요청은 로그인을 해야만(authenticated) 들어올 수 있습니다.
                        .anyRequest().authenticated()
                )
                // 7. OAuth2 로그인(카카오 로그인) 관련 설정
                .oauth2Login(oauth2 -> oauth2
                        // 카카오에서 인증 후 돌아올 주소 (application.yml 설정과 맞춤)
                        .redirectionEndpoint(redirection -> redirection.baseUri("/kakao/auth-code"))
                        // 사용자 정보를 가져올 때 사용할 서비스 (우리가 만든 CustomOAuth2UserService)
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        // 로그인 성공/실패 시 동작할 핸들러 지정
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                )
                // 8. JWT 필터 추가: 모든 요청 전에 JwtAuthenticationFilter를 먼저 실행해서 토큰이 있는지 검사합니다.
                // UsernamePasswordAuthenticationFilter라는 기본 필터 앞에서 가로채서 검사한다는 뜻입니다.
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), 
                                 UsernamePasswordAuthenticationFilter.class);

        return http.build(); // 설정을 완료하고 시큐리티 필터 체인을 생성합니다.
    }
}
