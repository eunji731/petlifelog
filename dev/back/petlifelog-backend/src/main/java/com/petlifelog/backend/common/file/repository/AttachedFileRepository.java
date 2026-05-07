package com.petlifelog.backend.common.file.repository;

import com.petlifelog.backend.common.file.domain.AttachedFile;
import com.petlifelog.backend.common.file.domain.ParentDomainType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AttachedFileRepository extends JpaRepository<AttachedFile, UUID> {

    List<AttachedFile> findByParentTypeAndParentIdOrderBySortOrderAsc(
            ParentDomainType parentType, UUID parentId);

    // 소유권 검증을 포함한 조회 (삭제 전 검증용)
    List<AttachedFile> findByIdInAndParentTypeAndParentId(
            List<UUID> ids, ParentDomainType parentType, UUID parentId);

    // 부모 삭제 시 연계 삭제용
    List<AttachedFile> findByParentTypeAndParentId(
            ParentDomainType parentType, UUID parentId);
}
