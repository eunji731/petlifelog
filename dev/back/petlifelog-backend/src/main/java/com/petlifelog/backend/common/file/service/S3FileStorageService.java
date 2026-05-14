package com.petlifelog.backend.common.file.service;

import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.exception.FileStorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.storage.type", havingValue = "s3")
public class S3FileStorageService implements FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp", "tiff", "tif"
    );

    private final S3Client s3Client;

    @Value("${app.s3.bucket}")
    private String bucket;

    @Value("${app.s3.region:ap-northeast-2}")
    private String region;

    @Override
    public String store(MultipartFile file, ParentDomainType parentType, UUID parentId) {
        String ext = extractExtension(file.getOriginalFilename());
        validateExtension(ext);
        String storedName = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
        String storedPath = parentType.name().toLowerCase() + "/" + parentId + "/" + storedName;

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(storedPath)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new FileStorageException("S3 파일 저장 실패: " + file.getOriginalFilename(), e);
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

        try {
            byte[] bytes = inputStream.readAllBytes();
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(storedPath)
                            .contentType("image/" + (ext.isEmpty() ? "jpeg" : ext))
                            .build(),
                    RequestBody.fromBytes(bytes)
            );
        } catch (IOException e) {
            throw new FileStorageException("S3 파일 저장 실패: " + originalFilename, e);
        }

        return storedPath;
    }

    @Override
    public void delete(String storedPath) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(storedPath)
                .build());
    }

    @Override
    public void deleteOrphans(Set<String> activeStoredPaths) {
        log.warn("S3 deleteOrphans is not implemented yet.");
    }

    @Override
    public InputStream getInputStream(String storedPath) {
        return s3Client.getObject(GetObjectRequest.builder()
                .bucket(bucket)
                .key(storedPath)
                .build());
    }

    @Override
    public String getFileUrl(String storedPath) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucket, region, storedPath);
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
