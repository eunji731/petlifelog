package com.petlifelog.backend.common.file.domain;

/**
 * 파일 첨부가 가능한 부모 도메인 목록.
 * 새 도메인에 파일을 붙이려면 여기에 값을 추가한다.
 */
public enum ParentDomainType {
    MEMORY,
    DIARY,
    RECORD,
    PET_PROFILE,
    INVENTORY
}
