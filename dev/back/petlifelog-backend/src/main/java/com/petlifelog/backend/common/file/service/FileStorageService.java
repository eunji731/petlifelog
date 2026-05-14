package com.petlifelog.backend.common.file.service;

import com.petlifelog.backend.common.file.domain.ParentDomainType;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Set;
import java.util.UUID;

public interface FileStorageService {
    /**
     * MultipartFile 을 스토리지에 저장하고 storedPath(상대경로)를 반환한다.
     */
    String store(MultipartFile file, ParentDomainType parentType, UUID parentId);

    /**
     * InputStream 으로 파일을 저장한다.
     */
    String storeFromStream(InputStream inputStream, String originalFilename,
                           ParentDomainType parentType, UUID parentId);

    /**
     * 물리 파일을 삭제한다.
     */
    void delete(String storedPath);

    /**
     * DB에 기록된 경로 집합을 받아, 스토리지에는 있지만 DB에 없는 고아 파일을 삭제한다.
     */
    void deleteOrphans(Set<String> activeStoredPaths);

    /**
     * 저장된 파일의 InputStream 을 가져온다.
     */
    InputStream getInputStream(String storedPath);

    /**
     * 파일에 접근 가능한 URL 을 생성한다.
     */
    String getFileUrl(String storedPath);
}
