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

/**
 * [사용자(회원) 엔티티]
 *
 * 카카오 소셜 로그인으로 가입한 사용자를 나타냅니다.
 * DB 테이블명은 'users'이며, 내부적으로 Member라는 이름을 사용합니다.
 *
 * ▶ 주요 필드 설명
 *   - kakaoId: 카카오에서 발급한 고유 ID (로그인 연동 키)
 *   - refreshTokenHash: Refresh Token의 SHA-256 해시값 저장 (원본 미저장, 보안)
 *   - tokenIssuedAt: 토큰 발급 시각 (토큰 재사용 감지에 활용)
 *   - isActive: false면 탈퇴 상태 (소프트 삭제)
 *   - aiContext: AI 일기 생성 시 프롬프트 앞에 추가되는 보호자 개인 설명
 *
 * ▶ 탈퇴/복구 흐름
 *   1. 탈퇴: isActive = false, refreshTokenHash = null (자동 로그아웃)
 *   2. 복구: isActive = true, 반려동물 데이터도 함께 복구
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA가 객체를 만들 때만 사용 (외부에서 new Member() 불가)
@Entity
@Table(name = "users")
public class Member extends BaseTimeEntity {

    @Id
    @UuidGenerator // UUID를 자동으로 생성해줍니다.
    @Column(columnDefinition = "UUID")
    private UUID id;

    // 카카오에서 발급한 고유 숫자 ID (카카오 로그인 연동의 핵심 키)
    @Column(name = "kakao_id", nullable = false, unique = true)
    private Long kakaoId;

    @Column(name = "kakao_email")
    private String kakaoEmail;

    @Column(name = "kakao_nickname")
    private String kakaoNickname;

    // 서비스 내 닉네임 (카카오 닉네임을 초기값으로 사용)
    @Column(nullable = false)
    private String nickname;

    @Column(name = "profile_image_path")
    private String profileImagePath;

    // Refresh Token을 SHA-256으로 해시하여 저장 (원본 토큰 탈취 시 DB만으로 복원 불가)
    @Column(name = "refresh_token_hash")
    private String refreshTokenHash;

    // 마지막 토큰 발급 시각 (Refresh Token Rotation 시 이전 토큰 무효화에 활용)
    @Column(name = "token_issued_at")
    private Instant tokenIssuedAt;

    // false = 탈퇴 상태 (소프트 삭제). 데이터는 유지되며 재가입으로 복구 가능.
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // 권한 (USER, ADMIN). JWT에 포함되어 API 접근 제어에 사용.
    @Column(nullable = false, length = 50)
    private String role;

    // AI 일기 생성 시 Gemini 프롬프트 앞에 삽입되는 보호자 개인 컨텍스트
    // 예: "우리 강아지는 산책을 매우 좋아하고 낯선 사람을 무서워합니다."
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

    /** 카카오 프로필 정보 업데이트 (재로그인 시 최신 정보 동기화) */
    public Member update(String nickname, String profileImagePath) {
        this.nickname = nickname;
        this.profileImagePath = profileImagePath;
        return this;
    }

    /** AI 개인화 컨텍스트 수정 */
    public void updateAiContext(String aiContext) {
        this.aiContext = aiContext;
    }

    /** 새 Refresh Token 저장 (SHA-256 해시값으로 저장, 원본 미저장) */
    public void updateRefreshToken(String refreshTokenHash) {
        this.refreshTokenHash = refreshTokenHash;
        this.tokenIssuedAt = Instant.now();
    }

    /** Refresh Token 무효화 (로그아웃 등 특정 상황에서 토큰 강제 만료) */
    public void invalidateToken() {
        this.refreshTokenHash = null;
        this.tokenIssuedAt = Instant.now();
    }

    /** 회원 탈퇴 처리: 소프트 삭제 + 토큰 무효화 (자동 로그아웃) */
    public void withdraw() {
        this.isActive = false;
        this.refreshTokenHash = null; // 탈퇴 즉시 기존 세션 무효화
        this.tokenIssuedAt = Instant.now();
    }

    /** 계정 복구 (탈퇴 후 재가입): isActive를 true로 변경 */
    public void reactivate(String nickname, String profileImagePath) {
        this.isActive = true;
        this.nickname = nickname;
        this.profileImagePath = profileImagePath;
    }
}
