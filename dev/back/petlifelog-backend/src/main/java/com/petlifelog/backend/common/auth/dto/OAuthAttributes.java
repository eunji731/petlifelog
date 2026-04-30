package com.petlifelog.backend.common.auth.dto;

import com.petlifelog.backend.domain.member.Member;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * [카카오 사용자 정보 변환 가방(DTO)]
 * 카카오에서 보내준 복잡한 사용자 정보(JSON)를 우리 서버에서 쓰기 좋게
 * 필요한 것들만 쏙쏙 뽑아서 담아두는 클래스입니다.
 */
@Getter
public class OAuthAttributes {
    private Map<String, Object> attributes; // 카카오가 준 원본 데이터 전체 (로그용)
    private String nameAttributeKey; // 사용자를 식별할 키값 이름 (보통 "id")
    private Long kakaoId; // 사용자의 카카오 고유 번호 (숫자)
    private String nickname; // 카카오 닉네임
    private String email; // 카카오 이메일
    private String profileImagePath; // 카카오 프로필 사진 주소

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

    /**
     * [카카오 원본 데이터를 분석하는 도구]
     * 카카오는 데이터를 { "id": 123, "kakao_account": { "profile": { "nickname": "..." } } } 이런 식으로 복잡하게 줍니다.
     * 여기서 필요한 정보만 꺼내서 우리 객체로 만드는 과정입니다.
     */
    @SuppressWarnings("unchecked")
    public static OAuthAttributes ofKakao(String userNameAttributeName, Map<String, Object> attributes) {
        // 1. 카카오 데이터 뭉치에서 "kakao_account"라는 큰 주머니를 꺼냅니다.
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        
        // 2. "kakao_account" 주머니 안에서 "profile"이라는 작은 주머니를 또 꺼냅니다.
        Map<String, Object> profile = kakaoAccount != null
                ? (Map<String, Object>) kakaoAccount.get("profile")
                : null;

        // 3. 작은 주머니들 안에서 실제 닉네임, 이메일, 이미지 주소를 꺼냅니다.
        String nickname = profile != null ? (String) profile.get("nickname") : null;
        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        String profileImageUrl = profile != null ? (String) profile.get("profile_image_url") : null;

        // 4. 꺼낸 정보들을 모아서 이 클래스(OAuthAttributes)의 객체를 만들어 리턴합니다.
        return OAuthAttributes.builder()
                .kakaoId((Long) attributes.get("id")) // 카카오 고유 ID
                .nickname(nickname)
                .email(email)
                .profileImagePath(profileImageUrl)
                .attributes(attributes)
                .nameAttributeKey(userNameAttributeName)
                .build();
    }

    /**
     * [회원 엔티티로 변환]
     * 처음 로그인한 사람일 경우, 이 정보를 바탕으로 DB에 저장할 실제 'Member(회원)' 데이터를 만듭니다.
     */
    public Member toEntity() {
        return Member.builder()
                .kakaoId(kakaoId)
                .kakaoEmail(email)
                .kakaoNickname(nickname)
                .nickname(nickname) // 우리 서비스에서 쓸 별명도 처음엔 카카오 별명으로 설정!
                .profileImagePath(profileImagePath)
                .role("ROLE_USER") // 처음 오면 기본적으로 '일반 유저' 권한을 줍니다. (tb_code의 code 값)
                .build();
    }
}
