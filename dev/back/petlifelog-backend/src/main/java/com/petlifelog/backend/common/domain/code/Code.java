package com.petlifelog.backend.common.domain.code;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * [공통코드 엔티티]
 * 권한(ROLE), 선택지 같이 여러 도메인에서 공유하는 코드값을 관리합니다.
 * tb_code 테이블과 매핑됩니다.
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "tb_code")
@EntityListeners(AuditingEntityListener.class)
public class Code {

    @Id
    @Column(name = "code_id", length = 20)
    private String codeId; // 코드 PK (예: COD00000001) — IdGenerator로 생성

    @Column(nullable = false, length = 50, unique = true)
    private String code; // 실제 코드값 (예: ROLE_USER) — 전체 코드에서 유일

    @Column(nullable = false, length = 50)
    private String name; // 코드명 (예: 일반 사용자)

    @Column(nullable = false, length = 50)
    private String type; // 코드 타입 (예: ROLE) — CodeType enum 값과 일치

    @Column(name = "sort_order", nullable = false)
    private Long sortOrder; // 같은 타입 내 정렬 순서

    @Column(name = "use_yn", nullable = false, length = 1)
    private String useYn; // 사용 여부 (Y/N)

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @Column(name = "created_by", updatable = false, nullable = false, length = 50)
    private String createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", nullable = false, length = 50)
    private String updatedBy;

    @Builder
    public Code(String code, String name, String type,
                Long sortOrder, String useYn, String createdBy, String updatedBy) {
        this.code = code;
        this.name = name;
        this.type = type;
        this.sortOrder = sortOrder;
        this.useYn = useYn;
        this.createdBy = createdBy;
        this.updatedBy = updatedBy;
    }

    // codeId는 같은 패키지의 CodeService에서만 IdGenerator를 통해 주입합니다.
    void assignId(String id) {
        if (this.codeId != null) throw new IllegalStateException("ID는 한 번만 설정할 수 있습니다.");
        this.codeId = id;
    }
}
