package com.petlifelog.backend.common.auth.dto;

import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.Role;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
public class OAuthAttributes {
    private Map<String, Object> attributes;
    private String nameAttributeKey;
    private Long kakaoId;
    private String nickname;
    private String email;
    private String profileImagePath;

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

    @SuppressWarnings("unchecked")
    public static OAuthAttributes ofKakao(String userNameAttributeName, Map<String, Object> attributes) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        Map<String, Object> profile = kakaoAccount != null
                ? (Map<String, Object>) kakaoAccount.get("profile")
                : null;

        String nickname = profile != null ? (String) profile.get("nickname") : null;
        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        String profileImageUrl = profile != null ? (String) profile.get("profile_image_url") : null;

        return OAuthAttributes.builder()
                .kakaoId((Long) attributes.get("id"))
                .nickname(nickname)
                .email(email)
                .profileImagePath(profileImageUrl)
                .attributes(attributes)
                .nameAttributeKey(userNameAttributeName)
                .build();
    }

    public Member toEntity() {
        return Member.builder()
                .kakaoId(kakaoId)
                .kakaoEmail(email)
                .kakaoNickname(nickname)
                .nickname(nickname)
                .profileImagePath(profileImagePath)
                .role(Role.USER)
                .build();
    }
}
