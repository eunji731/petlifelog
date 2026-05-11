package com.petlifelog.backend.domain.memory;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "photos", indexes = {
    @Index(name = "idx_photos_gps", columnList = "gps_lat, gps_lng")
})
public class Photo extends BaseTimeEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memory_id", nullable = false)
    private Memory memory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moment_id")
    private MemoryMoment moment;

    @Column(name = "path_origin", nullable = false)
    private String pathOrigin;

    @Column(name = "path_thumb_300")
    private String pathThumb300;

    @Column(name = "path_thumb_100")
    private String pathThumb100;

    @Column(name = "taken_at")
    private LocalDateTime takenAt;

    @Column(name = "gps_lat")
    private Double gpsLat;

    @Column(name = "gps_lng")
    private Double gpsLng;

    @Column(name = "gps_source", nullable = false)
    private String gpsSource = "NONE";

    @Column(name = "ai_caption")
    private String aiCaption;

    @Column(name = "ai_emotion")
    private String aiEmotion;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "ai_comment")
    private String aiComment;

    @Column(name = "vibe_score")
    private Integer vibeScore;

    @Column(name = "is_best", columnDefinition = "BOOLEAN NOT NULL DEFAULT false")
    private Boolean isBest = false;

    @OneToMany(mappedBy = "photo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PhotoThemeTag> themeTags = new ArrayList<>();

    @Builder
    public Photo(Memory memory, MemoryMoment moment, String pathOrigin, LocalDateTime takenAt, Double gpsLat, Double gpsLng, String gpsSource, Integer sortOrder) {
        this.memory = memory;
        this.moment = moment;
        this.pathOrigin = pathOrigin;
        this.takenAt = takenAt;
        this.gpsLat = gpsLat;
        this.gpsLng = gpsLng;
        this.gpsSource = gpsSource != null ? gpsSource : "NONE";
        this.sortOrder = sortOrder != null ? sortOrder : 0;
        this.isBest = false;
    }

    public void assignMoment(MemoryMoment moment) {
        this.moment = moment;
    }

    public void updateAiData(String aiComment, Integer vibeScore, Boolean isBest) {
        this.aiComment = aiComment;
        this.vibeScore = vibeScore;
        this.isBest = isBest != null && isBest;
    }
}
