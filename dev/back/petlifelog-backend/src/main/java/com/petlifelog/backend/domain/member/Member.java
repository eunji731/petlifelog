package com.petlifelog.backend.domain.member;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;


// DB의 'users' 테이블과 연결되는 자바 클래스(엔티티)입니다.
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 직접 new Member() 하는 것을 막고 상속 등을 통한 사용만 허용합니다.
@Entity
@Table(name = "users") // 실제 DB 테이블 이름은 users로 지정합니다.
public class Member extends BaseTimeEntity {

    @Id // 기본키(PK)
    @UuidGenerator // ID를 중복되지 않는 긴 문자열인 UUID로 자동 생성합니다.
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "kakao_id", nullable = false, unique = true)
    private Long kakaoId; // 카카오에서 준 고유 번호 (회원 식별용)

    @Column(name = "kakao_email")
    private String kakaoEmail; // 카카오에서 가져온 이메일

    @Column(name = "kakao_nickname")
    private String kakaoNickname; // 카카오에서 가져온 닉네임

    @Column(nullable = false)
    private String nickname; // 우리 서비스 내에서 사용할 닉네임 (변경 가능)

    @Column(name = "profile_image_path")
    private String profileImagePath; // 프로필 이미지 URL

    @Column(name = "refresh_token_hash")
    private String refreshTokenHash; // 보안을 위해 Refresh Token을 SHA-256으로 해싱해서 저장

    @Column(name = "token_issued_at")
    private Instant tokenIssuedAt; // 마지막으로 토큰이 발급된 시각

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // 계정 활성화 여부 (탈퇴 등 처리용)

    @Column(nullable = false, length = 50)
    private String role; // 사용자 권한 코드 (tb_code 참조, 예: ROLE_USER)

    @Builder // 빌더 패턴을 사용하여 객체 생성을 안전하고 편리하게 만듭니다.
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

    // [정보 업데이트 메서드]
    // 카카오 로그인 시 사용자의 닉네임이나 사진이 바뀌었다면 업데이트합니다.
    public Member update(String nickname, String profileImagePath) {
        this.nickname = nickname;
        this.profileImagePath = profileImagePath;
        return this;
    }

    // [Refresh Token 업데이트]
    // 로그인을 새로 하거나 토큰을 재발급받을 때 새로운 해시값을 저장하고 발행 시각을 기록합니다.
    public void updateRefreshToken(String refreshTokenHash) {
        this.refreshTokenHash = refreshTokenHash;
        this.tokenIssuedAt = Instant.now();
    }

    // [토큰 무효화]
    // 로그아웃 시 더 이상 Refresh Token을 쓸 수 없도록 지워버립니다.
    public void invalidateToken() {
        this.refreshTokenHash = null;
        this.tokenIssuedAt = Instant.now();
    }
}
