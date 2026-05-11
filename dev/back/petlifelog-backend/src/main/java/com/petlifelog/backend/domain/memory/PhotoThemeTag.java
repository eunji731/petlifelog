package com.petlifelog.backend.domain.memory;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "photo_theme_tags", indexes = {
    @Index(name = "idx_photo_theme_tags_tag", columnList = "tag"),
    @Index(name = "idx_photo_theme_tags_photo_id", columnList = "photo_id")
})
public class PhotoThemeTag {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_id", nullable = false)
    private Photo photo;

    @Column(nullable = false, length = 50)
    private String tag;

    @Builder
    public PhotoThemeTag(Photo photo, String tag) {
        this.photo = photo;
        this.tag = tag;
    }
}
