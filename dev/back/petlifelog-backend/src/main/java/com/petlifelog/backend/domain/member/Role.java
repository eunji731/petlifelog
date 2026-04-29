package com.petlifelog.backend.domain.member;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

// 사용자의 권한 등급을 나타내는 열거형(Enum)입니다.
@Getter
@RequiredArgsConstructor
public enum Role {
    // 권한 이름 앞에 "ROLE_"을 붙이는 것이 스프링 시큐리티의 관례입니다.
    USER("ROLE_USER"),
    ADMIN("ROLE_ADMIN");

    private final String key; // 실제 시큐리티에서 인식할 때 사용할 키값
}
