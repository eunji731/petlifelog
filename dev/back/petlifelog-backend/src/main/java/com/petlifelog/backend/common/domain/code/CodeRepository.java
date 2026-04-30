package com.petlifelog.backend.common.domain.code;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CodeRepository extends JpaRepository<Code, String> {

    // 특정 타입의 사용 중인 코드 목록을 정렬 순서대로 조회
    List<Code> findByTypeAndUseYnOrderBySortOrder(String type, String useYn);

    // code 값으로 단건 조회 (code 컬럼은 unique)
    Optional<Code> findByCode(String code);
}
