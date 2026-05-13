package com.petlifelog.backend.domain.member.domain;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "users")
public class Member extends BaseTimeEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "kakao_id", nullable = false, unique = true)
    private Long kakaoId;

    @Column(name = "kakao_email")
    private String kakaoEmail;

    @Column(name = "kakao_nickname")
    private String kakaoNickname;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "profile_image_path")
    private String profileImagePath;

    @Column(name = "refresh_token_hash")
    private String refreshTokenHash;

    @Column(name = "token_issued_at")
    private Instant tokenIssuedAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false, length = 50)
    private String role;

    @Column(name = "ai_context", columnDefinition = "TEXT")
    private String aiContext;

    @Builder
    public Member(Long kakaoId, String kakaoEmail, String kakaoNickname,
                  String nickname, String profileImagePath, String role) {
        this.kakaoId = kakaoId;
        this.kakaoEmail = kakaoEmail;
        this.kakaoNickname = kakaoNickname;
        this.nickname = nickname;
        this.profileImagePath = profileImagePath;
        this.role = role;
        this.isActive = true;
    }

    public Member update(String nickname, String profileImagePath) {
        this.nickname = nickname;
        this.profileImagePath = profileImagePath;
        return this;
    }

    public void updateAiContext(String aiContext) {
        this.aiContext = aiContext;
    }

    public void updateRefreshToken(String refreshTokenHash) {
        this.refreshTokenHash = refreshTokenHash;
        this.tokenIssuedAt = Instant.now();
    }

    public void invalidateToken() {
        this.refreshTokenHash = null;
        this.tokenIssuedAt = Instant.now();
    }

    public void withdraw() {
        this.isActive = false;
        this.refreshTokenHash = null;
        this.tokenIssuedAt = Instant.now();
    }

    public void reactivate(String nickname, String profileImagePath) {
        this.isActive = true;
        this.nickname = nickname;
        this.profileImagePath = profileImagePath;
    }
}
