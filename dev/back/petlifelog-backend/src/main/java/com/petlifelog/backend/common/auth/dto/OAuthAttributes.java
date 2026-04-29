package com.petlifelog.backend.common.auth.dto;

import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.Role;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

// 카카오에서 보내준 사용자 정보(JSON)를 자바 객체로 변환하여 담는 가방(DTO)입니다.
@Getter
public class OAuthAttributes {
    private Map<String, Object> attributes; // 카카오가 준 원본 데이터 전체
    private String nameAttributeKey; // 카카오 로그인 응답의 주요 키값 (예: "id")
    private Long kakaoId; // 사용자의 카카오 고유 번호
    private String nickname; // 사용자의 닉네임
    private String email; // 사용자의 이메일
    private String profileImagePath; // 사용자의 프로필 이미지 주소

    @Builder
    public OAuthAttributes(Map<String, Object> attributes, String nameAttributeKey, 
                           Long kakaoId, String nickname, String email, String profileImagePath) {
        this.attributes = attributes;
        this.nameAttributeKey = nameAttributeKey;
        this.kakaoId = kakaoId;
        this.nickname = nickname;
        this.email = email;
        this.profileImagePath = profileImagePath;
    }

    // 카카오가 준 Map 데이터를 분석해서 우리 객체(OAuthAttributes)로 변환하는 static 메서드입니다.
    @SuppressWarnings("unchecked")
    public static OAuthAttributes ofKakao(String userNameAttributeName, Map<String, Object> attributes) {
        // 1. 카카오 응답 데이터에서 "kakao_account"라는 덩어리를 꺼냅니다.
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        
        // 2. "kakao_account" 안에서 또 "profile"이라는 덩어리를 꺼냅니다.
        Map<String, Object> profile = kakaoAccount != null
                ? (Map<String, Object>) kakaoAccount.get("profile")
                : null;

        // 3. 덩어리들 안에서 실제 닉네임, 이메일, 이미지 URL을 꺼냅니다.
        String nickname = profile != null ? (String) profile.get("nickname") : null;
        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        String profileImageUrl = profile != null ? (String) profile.get("profile_image_url") : null;

        // 4. 추출한 정보들을 담아 OAuthAttributes 객체를 생성해서 리턴합니다.
        return OAuthAttributes.builder()
                .kakaoId((Long) attributes.get("id")) // 카카오가 준 고유 ID
                .nickname(nickname)
                .email(email)
                .profileImagePath(profileImageUrl)
                .attributes(attributes)
                .nameAttributeKey(userNameAttributeName)
                .build();
    }

    // 처음 가입하는 사람일 경우, 이 데이터를 바탕으로 DB에 저장할 'Member' 엔티티를 만듭니다.
    public Member toEntity() {
        return Member.builder()
                .kakaoId(kakaoId)
                .kakaoEmail(email)
                .kakaoNickname(nickname)
                .nickname(nickname) // 우리 서비스에서 쓸 닉네임도 처음엔 카카오 닉네임으로!
                .profileImagePath(profileImagePath)
                .role(Role.USER) // 처음 가입하면 기본적으로 'USER' 권한을 줍니다.
                .build();
    }
}
