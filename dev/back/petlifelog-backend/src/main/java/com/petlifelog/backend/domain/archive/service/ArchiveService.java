package com.petlifelog.backend.domain.archive.service;

import com.petlifelog.backend.domain.archive.dto.ArchivePhotoResponse;
import com.petlifelog.backend.domain.archive.dto.ThemeTabResponse;
import com.petlifelog.backend.domain.memory.domain.Photo;
import com.petlifelog.backend.domain.memory.repository.PhotoThemeTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class ArchiveService {

    private final PhotoThemeTagRepository photoThemeTagRepository;

    public List<ThemeTabResponse> getTopThemes(UUID userId, UUID petId, int page, int size) {
        List<Object[]> rows = photoThemeTagRepository.findTopTags(
                userId, petId, PageRequest.of(page, size));

        return rows.stream().map(row -> ThemeTabResponse.builder()
                .tag((String) row[0])
                .count((Long) row[1])
                .representativePhotoUrl((String) row[2])
                .build()
        ).toList();
    }

    public List<ArchivePhotoResponse> getPhotosByTheme(UUID userId, String tag, UUID petId) {
        List<Photo> photos = photoThemeTagRepository.findPhotosByTag(userId, tag, petId);
        return toResponseList(photos);
    }

    public List<ArchivePhotoResponse> searchPhotos(UUID userId, String keyword, UUID petId) {
        List<Photo> photos = photoThemeTagRepository.searchPhotosByTagKeyword(userId, keyword, petId);
        return toResponseList(photos);
    }

    public List<String> suggestTags(UUID userId, String q, UUID petId) {
        return photoThemeTagRepository.suggestTags(userId, q, petId, PageRequest.of(0, 10));
    }

    public ThemeTabResponse getThemeByTag(UUID userId, String tag) {
        List<Object[]> rows = photoThemeTagRepository.findTagSummary(userId, tag);
        if (rows.isEmpty()) {
            return ThemeTabResponse.builder()
                    .tag(tag)
                    .count(0L)
                    .representativePhotoUrl(null)
                    .build();
        }
        Object[] row = rows.get(0);
        return ThemeTabResponse.builder()
                .tag(tag)
                .count((Long) row[1])
                .representativePhotoUrl((String) row[2])
                .build();
    }

    public List<ThemeTabResponse> searchThemes(UUID userId, String keyword, UUID petId) {
        List<Object[]> rows = photoThemeTagRepository.searchThemesByKeyword(userId, keyword, petId);
        return rows.stream().map(row -> ThemeTabResponse.builder()
                .tag((String) row[0])
                .count((Long) row[1])
                .representativePhotoUrl((String) row[2])
                .build()
        ).toList();
    }

    private List<ArchivePhotoResponse> toResponseList(List<Photo> photos) {
        return photos.stream()
                .map(photo -> ArchivePhotoResponse.from(photo, List.of()))
                .toList();
    }
}
