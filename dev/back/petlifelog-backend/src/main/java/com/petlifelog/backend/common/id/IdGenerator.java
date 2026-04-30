package com.petlifelog.backend.common.id;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * [공통 ID 생성기]
 * "COD00000001", "MBR00000001" 처럼 접두사 + 8자리 숫자 형식의 ID를 생성합니다.
 *
 * 사용 전 tb_id_sequence 테이블에 해당 prefix 행이 존재해야 합니다.
 *   INSERT INTO tb_id_sequence (prefix, last_value) VALUES ('COD', 0);
 */
@Component
public class IdGenerator {

    @PersistenceContext
    private EntityManager em;

    /**
     * 지정한 prefix로 다음 ID를 생성합니다. (자릿수 기본값: 8)
     * 예) generate("COD") → "COD00000001"
     *
     * REQUIRES_NEW: ID 채번은 별도 트랜잭션으로 즉시 커밋됩니다.
     * 외부 트랜잭션이 롤백되어도 채번된 번호는 소비된 것으로 간주합니다. (번호 공백 허용)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generate(String prefix) {
        return generate(prefix, 8);
    }

    /**
     * 지정한 prefix와 자릿수로 다음 ID를 생성합니다.
     * 예) generate("COD", 8) → "COD00000001"
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generate(String prefix, int digits) {
        // UPDATE ... RETURNING 은 단일 원자 연산이므로 동시 요청에도 안전합니다.
        @SuppressWarnings("unchecked")
        List<Number> result = em.createNativeQuery(
                "UPDATE tb_id_sequence SET last_value = last_value + 1 WHERE prefix = :prefix RETURNING last_value"
        ).setParameter("prefix", prefix).getResultList();

        if (result.isEmpty()) {
            throw new IllegalStateException(
                    "tb_id_sequence에 prefix '" + prefix + "'가 없습니다. 초기 데이터를 먼저 추가해주세요."
            );
        }

        long nextVal = result.get(0).longValue();
        return prefix + String.format("%0" + digits + "d", nextVal);
    }
}
