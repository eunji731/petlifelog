package com.petlifelog.backend.common.file.service;

import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.exception.FileStorageException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * 물리 파일 I/O 전담 서비스.
 * DB 작업 없이 스토리지만 담당한다.
 *
 * 실제 저장 루트: {app.upload.base-path}/files/
 * storedPath(DB)  : {parentType}/{parentId}/{uuid}.{ext}   ← filesRoot 기준 상대경로
 * URL 접근         : /files/{parentType}/{parentId}/{uuid}.{ext}  (WebConfig /files/**)
 *
 * 예: memory/550e8400-.../a1b2c3d4.jpg
 */
@Slf4j
@Service
public class FileStorageService {

    /** WebConfig /files/** 핸들러의 물리 루트: D:/uploads/files/ */
    @Getter
    private final Path filesRoot;

    public FileStorageService(@Value("${app.upload.base-path}") String basePath) {
        this.filesRoot = Paths.get(basePath, "files").toAbsolutePath().normalize();
    }

    /**
     * MultipartFile 을 스토리지에 저장하고 storedPath(상대경로)를 반환한다.
     */
    public String store(MultipartFile file, ParentDomainType parentType, UUID parentId) {
        String ext = extractExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
        String storedPath = parentType.name().toLowerCase() + "/" + parentId + "/" + storedName;

        Path targetPath = filesRoot.resolve(storedPath);
        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new FileStorageException("파일 저장 실패: " + file.getOriginalFilename(), e);
        }

        return storedPath;
    }

    /**
     * InputStream 으로 파일을 저장한다 (파일이 이미 메모리에 있는 경우 사용).
     * storedPath(상대경로)를 반환한다.
     */
    public String storeFromStream(InputStream inputStream, String originalFilename,
                                   ParentDomainType parentType, UUID parentId) {
        String ext = extractExtension(originalFilename);
        String storedName = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
        String storedPath = parentType.name().toLowerCase() + "/" + parentId + "/" + storedName;

        Path targetPath = filesRoot.resolve(storedPath);
        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new FileStorageException("파일 저장 실패: " + originalFilename, e);
        }

        return storedPath;
    }

    /**
     * 물리 파일을 삭제한다. 파일이 이미 없어도 예외를 던지지 않는다.
     */
    public void delete(String storedPath) {
        Path path = filesRoot.resolve(storedPath);
        try {
            boolean deleted = Files.deleteIfExists(path);
            if (!deleted) {
                log.warn("삭제 대상 파일이 이미 없음: {}", storedPath);
            }
        } catch (IOException e) {
            log.warn("물리 파일 삭제 실패: {}", storedPath, e);
        }
    }

    /**
     * DB에 기록된 경로 집합을 받아, 디스크에는 있지만 DB에 없는 고아 파일을 삭제한다.
     */
    public void deleteOrphans(Set<String> activeStoredPaths) {
        if (!Files.exists(filesRoot)) return;

        try (Stream<Path> paths = Files.walk(filesRoot)) {
            paths.filter(Files::isRegularFile).forEach(physicalPath -> {
                String relative = filesRoot.relativize(physicalPath)
                        .toString().replace("\\", "/");
                if (!activeStoredPaths.contains(relative)) {
                    try {
                        Files.deleteIfExists(physicalPath);
                        log.info("고아 파일 삭제: {}", relative);
                    } catch (IOException e) {
                        log.warn("고아 파일 삭제 실패: {}", relative, e);
                    }
                }
            });
        } catch (IOException e) {
            log.error("고아 파일 탐색 중 오류", e);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
