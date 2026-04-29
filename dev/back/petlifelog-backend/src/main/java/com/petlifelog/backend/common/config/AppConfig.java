package com.petlifelog.backend.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// 프로젝트 전반에 걸쳐 사용할 공통 도구(Bean)들을 정의하는 설정 클래스입니다.
@Configuration
public class AppConfig {

    // 비밀번호를 안전하게 암호화해주는 도구입니다. (로그인 비번 등을 다룰 때 사용)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 자바 객체를 JSON으로, JSON을 자바 객체로 변환해주는 도구입니다.
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
