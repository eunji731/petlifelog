package com.petlifelog.backend.common.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 로그인이 성공하거나 토큰을 재발급했을 때, 
// 클라이언트(프론트엔드)에게 보낼 데이터를 담는 그릇입니다.
@Getter
@Builder
@NoArgsConstructor // 파라미터 없는 생성자 자동 생성
@AllArgsConstructor // 모든 필드를 다 가진 생성자 자동 생성
public class TokenResponse {
    // 실제 API 호출 시 사용할 짧은 수명의 토큰
    private String accessToken;
    // Access Token이 만료됐을 때 재발급용으로 사용할 긴 수명의 토큰
    private String refreshToken;
}
