package com.petlifelog.backend.domain.member;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

// Member(users 테이블)를 DB에서 찾거나 저장하는 도구입니다.
// JpaRepository를 상속받으면 기본적인 CRUD(저장, 조회, 삭제) 기능이 자동으로 생성됩니다.
public interface MemberRepository extends JpaRepository<Member, UUID> {
    
    // 카카오 고유 ID(kakaoId)를 가지고 회원을 찾는 메서드를 정의합니다.
    // 메서드 이름 규칙에 따라 "findBy + 필드명"으로 지으면 자동으로 쿼리가 만들어집니다.
    // Optional은 결과가 없을 수도 있을 때 안전하게 처리하기 위한 박스 같은 것입니다.
    Optional<Member> findByKakaoId(Long kakaoId);
}
