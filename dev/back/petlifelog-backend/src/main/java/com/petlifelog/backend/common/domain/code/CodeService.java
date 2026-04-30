package com.petlifelog.backend.common.domain.code;

import com.petlifelog.backend.common.id.IdGenerator;
import com.petlifelog.backend.common.id.IdPrefix;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * [공통코드 서비스]
 * 코드 타입별 목록 조회, 단건 조회, 신규 등록 등 코드 관련 비즈니스 로직을 담당합니다.
 */
@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class CodeService {

    private final CodeRepository codeRepository;
    private final IdGenerator idGenerator;

    /**
     * 공통코드를 새로 등록합니다.
     * codeId는 IdGenerator가 자동으로 발급합니다. (예: COD00000001)
     */
    @Transactional
    public Code create(String code, String name, CodeType type, long sortOrder, String createdBy) {
        Code newCode = Code.builder()
                .code(code)
                .name(name)
                .type(type.name())
                .sortOrder(sortOrder)
                .useYn("Y")
                .createdBy(createdBy)
                .updatedBy(createdBy)
                .build();

        newCode.assignId(idGenerator.generate(IdPrefix.CODE));
        return codeRepository.save(newCode);
    }

    /**
     * 특정 타입의 사용 중인 코드 목록을 정렬 순서대로 반환합니다.
     * 사용 예: CodeType.ROLE → [ROLE_USER, ROLE_ADMIN]
     */
    public List<Code> findByType(CodeType type) {
        return codeRepository.findByTypeAndUseYnOrderBySortOrder(type.name(), "Y");
    }

    /**
     * code 값으로 코드 단건을 조회합니다.
     * 사용 예: "ROLE_USER" → Code(name="일반 사용자", ...)
     */
    public Code findByCode(String code) {
        return codeRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 코드입니다: " + code));
    }
}
