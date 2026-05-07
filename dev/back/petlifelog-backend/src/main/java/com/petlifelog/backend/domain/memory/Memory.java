package com.petlifelog.backend.domain.memory;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import com.petlifelog.backend.domain.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "memories")
public class Memory extends BaseTimeEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    @Column(name = "memory_date", nullable = false)
    private LocalDate memoryDate;

    private String summary;
    
    @Column(name = "activity_type")
    private String activityType;
    
    private String weather;
    
    @Column(name = "energy_level")
    private Integer energyLevel;
    
    private String location;
    
    @Column(name = "user_memo")
    private String userMemo;

    @Column(name = "ai_title")
    private String aiTitle;

    @Column(name = "ai_diary", columnDefinition = "TEXT")
    private String aiDiary;

    @Column(name = "ai_generate_count", nullable = false)
    private Integer aiGenerateCount = 0;

    @Column(name = "ai_status", nullable = false)
    private String aiStatus = "PENDING";

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "representative_photo_id")
    private Photo representativePhoto;

    @OneToMany(mappedBy = "memory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos = new ArrayList<>();

    @OneToMany(mappedBy = "memory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MemoryDog> memoryDogs = new ArrayList<>();

    @Builder
    public Memory(Member user, LocalDate memoryDate, String summary, String aiTitle, String aiDiary, String aiStatus) {
        this.user = user;
        this.memoryDate = memoryDate;
        this.summary = summary;
        this.aiTitle = aiTitle;
        this.aiDiary = aiDiary;
        this.aiStatus = aiStatus != null ? aiStatus : "PENDING";
        this.aiGenerateCount = 1;
    }

    public void setRepresentativePhoto(Photo photo) {
        this.representativePhoto = photo;
    }
}
