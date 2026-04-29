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
    public CorsConfigurationSource corsConfigurationSource() { // 프론트에서 백엔드로 요청해도 되는지 설정하는 메서드입니다.
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000")); // 프론트엔드 주소 허용
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")); // 허용할 HTTP 메서드
        config.setAllowedHeaders(List.of("*")); // 모든 헤더 허용
        config.setAllowCredentials(true); // 쿠키나 인증 정보를 포함한 요청 허용(HttpOnly JWT 쿠키를 쓸 거면 이게 필요)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // 모든 경로에 대해 위 설정을 적용
        return source;
    }

    // 스프링 시큐리티의 핵심 설정: 어떤 요청을 허용하고, 로그인은 어떻게 할지 정의합니다.(요청이 들어왔을 때 어떤 보안 검사를 어떤 순서로 할지 정하는 곳)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. 위에서 만든 CORS 설정을 적용합니다.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 2. CSRF 보안을 비활성화합니다. (REST API는 Stateless하므로 보통 끕니다)
                .csrf(AbstractHttpConfigurer::disable)
                // 3. 기본 로그인 폼을 비활성화합니다. (우리는 카카오 로그인을 쓸 거니까요) Spring Security 기본 로그인 화면을 끕니다.
                .formLogin(AbstractHttpConfigurer::disable)
                // 4. HTTP Basic 인증(아이디/비번 직접 전송)을 비활성화합니다. 브라우저 기본 팝업 로그인 같은 방식을 끕니다.
                .httpBasic(AbstractHttpConfigurer::disable)
                // 5. 세션 정책 설정: JWT를 사용하므로 세션을 만들지 않지만, OAuth2 내부 로직상 필요할 때만 생성하도록 합니다.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                // 6. URL별 권한 설정
                .authorizeHttpRequests(auth -> auth // 어떤 주소는 로그인 없이 허용하고, 어떤 주소는 로그인 필요하게 할지
                        // 아래 경로들은 로그인 안 해도 들어올 수 있게 'permitAll()' 처리합니다.
                        .requestMatchers("/", "/kakao/auth-code", "/oauth2/**", "/error", "/favicon.ico").permitAll() // 이 주소들은 로그인 없이 접근 가능
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/api/auth/reissue").permitAll() // 토큰 재발급 API는 로그인 없이 접근 허용
                        // 그 외 모든 요청은 로그인을 해야만(authenticated) 들어올 수 있습니다.
                        .anyRequest().authenticated()
                )
                // 7. OAuth2 로그인(카카오 로그인) 관련 설정
                .oauth2Login(oauth2 -> oauth2
                        // 카카오에서 인증 후 돌아올 주소 (application.yml 설정과 맞춤)(카카오 로그인 성공 후 돌아오는 주소를 /kakao/auth-code로 지정)
                        .redirectionEndpoint(redirection -> redirection.baseUri("/kakao/auth-code"))
                        // 사용자 정보를 가져올 때 사용할 서비스 (우리가 만든 CustomOAuth2UserService)(카카오에서 사용자 정보를 받아온 뒤, customOAuth2UserService로 처리)
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        // 로그인 성공/실패 시 동작할 핸들러 지정
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                )
                // 8. JWT 필터 추가(로그인 이후 API 요청에서 가장 중요): 모든 요청 전에 JwtAuthenticationFilter를 먼저 실행해서 토큰이 있는지 검사합니다.
                // 요청 쿠키에서 accessToken 찾기 -> JWT 검증 -> 정상 토큰이면 로그인한 사용자 정보를 SecurityContext에 저장 -> 그러면 .authenticated() 통과
                // 쿠키에 JWT 있음 -> JwtAuthenticationFilter가 확인 -> 로그인 인정 -> controller 실행
                // UsernamePasswordAuthenticationFilter라는 기본 필터 앞에서 가로채서 검사한다는 뜻입니다.
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), 
                                 UsernamePasswordAuthenticationFilter.class);

        return http.build(); // 설정을 완료하고 시큐리티 필터 체인을 생성합니다.
    }
}
// 프론트 localhost:3000 허용
//쿠키 포함 요청 허용
//CSRF는 꺼져 있음
//기본 로그인폼/Basic 인증 꺼져 있음
//세션은 필요하면 사용
//카카오 OAuth2 로그인 사용
//성공하면 OAuth2SuccessHandler 실행
//이후 요청은 JwtAuthenticationFilter가 JWT 검사
//대부분 API는 인증 필요