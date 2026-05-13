package com.petlifelog.backend.domain.memory.domain;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "memory_moments")
public class MemoryMoment extends BaseTimeEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memory_id", nullable = false)
    private Memory memory;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    private String category;

    @Column(name = "ai_title")
    private String aiTitle;

    @Column(name = "ai_content", columnDefinition = "TEXT")
    private String aiContent;

    @Column(name = "location_name")
    private String locationName;

    @Column(name = "energy_level")
    private Integer energyLevel;

    @Column(name = "tags")
    private String tags;

    @Column(name = "representative_photo_path")
    private String representativePhotoPath;

    @OneToMany(mappedBy = "moment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos = new ArrayList<>();

    @Builder
    public MemoryMoment(Memory memory, Integer sortOrder, String category,
                        String aiTitle, String aiContent, String locationName,
                        Integer energyLevel, String tags, String representativePhotoPath) {
        this.memory = memory;
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.category = category;
        this.aiTitle = aiTitle;
        this.aiContent = aiContent;
        this.locationName = locationName;
        this.energyLevel = energyLevel;
        this.tags = tags;
        this.representativePhotoPath = representativePhotoPath;
    }
}
