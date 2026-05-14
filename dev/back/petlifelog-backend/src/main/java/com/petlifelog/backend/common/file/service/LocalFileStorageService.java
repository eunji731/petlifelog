package com.petlifelog.backend.common.file.service;

import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.exception.FileStorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "tiff", "tif"
    );

    private final Path filesRoot;

    public LocalFileStorageService(@Value("${app.upload.base-path}") String basePath) {
        this.filesRoot = Paths.get(basePath, "files").toAbsolutePath().normalize();
    }

    @Override
    public String store(MultipartFile file, ParentDomainType parentType, UUID parentId) {
        String ext = extractExtension(file.getOriginalFilename());
        validateExtension(ext);
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

    @Override
    public String storeFromStream(InputStream inputStream, String originalFilename,
                                   ParentDomainType parentType, UUID parentId) {
        String ext = extractExtension(originalFilename);
        validateExtension(ext);
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

    @Override
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

    @Override
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

    @Override
    public InputStream getInputStream(String storedPath) {
        Path path = filesRoot.resolve(storedPath);
        try {
            return new FileInputStream(path.toFile());
        } catch (IOException e) {
            throw new FileStorageException("파일 읽기 실패: " + storedPath, e);
        }
    }

    @Override
    public String getFileUrl(String storedPath) {
        return "/files/" + storedPath;
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private void validateExtension(String ext) {
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new FileStorageException("허용되지 않는 파일 형식입니다: " + ext, null);
        }
    }
}
