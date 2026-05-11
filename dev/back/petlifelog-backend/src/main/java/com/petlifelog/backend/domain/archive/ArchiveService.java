package com.petlifelog.backend.domain.archive;

import com.petlifelog.backend.domain.archive.dto.ArchivePhotoResponse;
import com.petlifelog.backend.domain.archive.dto.ThemeTabResponse;
import com.petlifelog.backend.domain.memory.Photo;
import com.petlifelog.backend.domain.memory.PhotoThemeTagRepository;
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

    public List<ThemeTabResponse> getTopThemes(UUID userId, UUID petId, int limit) {
        List<Object[]> rows = photoThemeTagRepository.findTopTags(
                userId, petId, PageRequest.of(0, limit));

        return rows.stream().map(row -> {
            String tag = (String) row[0];
            Long count = (Long) row[1];
            String repPhoto = photoThemeTagRepository.findRepresentativePhotoByTag(userId, tag);
            return ThemeTabResponse.builder()
                    .tag(tag)
                    .count(count)
                    .representativePhotoUrl(repPhoto)
                    .build();
        }).toList();
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

    private List<ArchivePhotoResponse> toResponseList(List<Photo> photos) {
        return photos.stream().map(photo -> {
            List<String> themeTags = photoThemeTagRepository.findTagsByPhotoId(photo.getId());
            return ArchivePhotoResponse.from(photo, themeTags);
        }).toList();
    }
}
