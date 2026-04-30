package com.petlifelog.backend.common.id;

/**
 * [ID 접두사 상수]
 * 새 도메인이 생길 때마다 여기에 prefix를 추가하고,
 * tb_id_sequence 테이블에도 같은 prefix 행을 INSERT 해야 합니다.
 */
public final class IdPrefix {
    private IdPrefix() {}

    public static final String CODE   = "COD"; // 공통코드
    // 예시 (추후 추가)
    public static final String MEMBER = "USR";
    public static final String PET    = "PET";
    public static final String DIARY  = "DRY";
}
