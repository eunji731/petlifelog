package com.petlifelog.backend.common.config;

import com.petlifelog.backend.common.auth.CustomOAuth2UserService;
import com.petlifelog.backend.common.auth.JwtAuthenticationFilter;
import com.petlifelog.backend.common.auth.JwtTokenProvider;
import com.petlifelog.backend.common.auth.OAuth2FailureHandler;
import com.petlifelog.backend.common.auth.OAuth2SuccessHandler;
import com.petlifelog.backend.domain.member.repository.MemberRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

/**
 * [스프링 시큐리티 설정 클래스]
 * 이 클래스는 우리 앱의 '보안관' 역할을 합니다.
 * 누가 들어올 수 있는지, 어떤 문(URL)을 열어둘지, 신분증(JWT)은 어떻게 확인할지를 결정합니다.
 */
@RequiredArgsConstructor // final이 붙은 필드(객체)들을 스프링이 알아서 넣어줍니다 (의존성 주입)
@Configuration // "이 클래스는 설정 파일이에요!"라고 스프링에게 알려줍니다.
@EnableWebSecurity // 스프링 시큐리티의 핵심 기능들을 활성화합니다.
public class SecurityConfig {

    // 우리가 직접 만든 보안 관련 부품들입니다.
    private final CustomOAuth2UserService customOAuth2UserService; // 카카오에서 받아온 사용자 정보를 처리하는 서비스
    private final OAuth2SuccessHandler oAuth2SuccessHandler; // 카카오 로그인 성공 시 실행될 로직 (쿠키 굽기 등)
    private final OAuth2FailureHandler oAuth2FailureHandler; // 카카오 로그인 실패 시 실행될 로직
    private final JwtTokenProvider jwtTokenProvider; // JWT 토큰을 만들고 검증하는 '신분증 발급기'
    private final MemberRepository memberRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * [CORS 설정]
     * 원래 브라우저는 자기 도메인(예: localhost:3000)이 아닌 곳에 요청을 보내는 걸 막습니다.
     * 프론트엔드(React)에서 백엔드로 데이터를 보낼 수 있게 허락해주는 설정입니다.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // 1. 어떤 주소에서 오는 요청을 허락할 것인가? (프론트엔드 주소)
        config.setAllowedOrigins(List.of(frontendUrl));
        
        // 2. 어떤 방식의 요청을 허락할 것인가? (GET, POST 등)
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // 3. 어떤 헤더 정보를 허락할 것인가? (보통 모든걸 다 허용함)
        config.setAllowedHeaders(List.of("*"));
        
        // 4. [중요] 쿠키를 주고받을 수 있게 허용할 것인가?
        // 우리는 HttpOnly 쿠키 방식을 쓰기 때문에 반드시 true로 설정해야 합니다.
        config.setAllowCredentials(true); 

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // 모든 주소(/**)에 대해 위 규칙 적용
        return source;
    }

    /**
     * [시큐리티 필터 체인]
     * 요청이 들어올 때 거쳐야 하는 '검문소 목록'입니다.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. 위에서 만든 CORS(다른 도메인 허용) 설정을 적용합니다.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                // 2. CSRF 보안 비활성화
                // HttpOnly 쿠키를 사용하므로 원칙적으로는 CSRF 공격에 노출될 수 있습니다.
                // 단, 쿠키에 SameSite=Lax 옵션을 설정했기 때문에 브라우저가 타 도메인에서 오는
                // POST/PUT/DELETE 요청에 쿠키를 자동으로 차단해 줍니다.
                // 이로 인해 Spring의 CSRF 토큰 방식과 동일한 수준의 보호가 브라우저 레벨에서 제공되므로
                // Spring CSRF를 별도로 활성화하지 않아도 됩니다.
                .csrf(AbstractHttpConfigurer::disable)
                
                // 3. 기본 로그인 폼 비활성화
                // 스프링 시큐리티가 기본으로 제공하는 아이디/비번 로그인 화면을 안 쓰겠다는 뜻입니다. (카카오 로그인을 쓰니까요)
                .formLogin(AbstractHttpConfigurer::disable)
                
                // 4. HTTP Basic 인증 비활성화
                // 브라우저 팝업창으로 아이디/비번 묻는 아주 옛날 방식을 안 쓰겠다는 뜻입니다.
                .httpBasic(AbstractHttpConfigurer::disable)
                
                // 5. 세션 정책 설정
                // 우리는 JWT(신분증)를 쓰기 때문에 서버에 세션을 저장하지 않습니다(STATELESS).
                // 다만, OAuth2 로그인 과정에서 내부적으로 잠깐 필요할 때만 만들도록 IF_REQUIRED로 설정합니다.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                
                // 6. [URL별 권한 설정] - 어떤 문을 열어줄지 정합니다.
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/kakao/auth-code", "/oauth2/**", "/error", "/favicon.ico").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/api/auth/reissue").permitAll()
                        .requestMatchers("/api/members/rejoin").permitAll()
                        // 정적 이미지 파일: 인증 없이 접근 가능 (경로에 UUID 포함되어 추측 불가)
                        .requestMatchers("/files/**", "/uploads/**").permitAll()
                        .anyRequest().authenticated()
                )
                // 미인증 요청 시 OAuth2 로그인 리다이렉트 대신 401 반환
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"error\":\"Unauthorized\"}");
                        })
                )
                
                // 7. [OAuth2 로그인(카카오) 설정]
                .oauth2Login(oauth2 -> oauth2
                        // 카카오 로그인 창에서 로그인을 마친 후, 우리 서버로 돌아올 주소입니다. (Redirection)
                        .redirectionEndpoint(redirection -> redirection.baseUri("/kakao/auth-code"))
                        
                        // 카카오에서 준 사용자 데이터를 가져온 뒤, 어떻게 처리할지 정한 서비스입니다.
                        // 카카오 code 받음 ->  Spring Security가 code를 카카오 accessToken으로 바꿈 -> 그 accessToken을 userRequest 안에 넣어둠
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        
                        // 로그인이 성공했을 때와 실패했을 때 어떤 동작을 할지 정합니다.
                        .successHandler(oAuth2SuccessHandler) // 성공하면 여기서 쿠키를 구워줍니다.
                        .failureHandler(oAuth2FailureHandler)
                )
                
                // 8. [JWT 검문소(Filter) 추가] - 가장 중요!
                // 모든 요청이 컨트롤러(비즈니스 로직)에 도착하기 전에, 이 필터가 먼저 신분증(JWT)을 검사합니다.
                // HttpOnly 쿠키에서 토큰을 꺼내서 "이 사람 로그인한 거 맞네!"라고 인정해주면 다음 단계로 넘어갑니다.
                // UsernamePasswordAuthenticationFilter라는 기본 검문소 앞에 우리 검문소를 세웁니다.
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider, memberRepository),
                                 UsernamePasswordAuthenticationFilter.class);

        return http.build(); // 설정 끝! '보안관' 임무 시작!
    }
}
// 프론트 localhost:3000 허용
//쿠키 포함 요청 허용
//CSRF는 꺼져 있음 (쿠키의 SameSite=Lax로 브라우저 레벨에서 대체)
//기본 로그인폼/Basic 인증 꺼져 있음
//세션은 필요하면 사용
//카카오 OAuth2 로그인 사용
//성공하면 OAuth2SuccessHandler 실행
//이후 요청은 JwtAuthenticationFilter가 JWT 검사
//대부분 API는 인증 필요