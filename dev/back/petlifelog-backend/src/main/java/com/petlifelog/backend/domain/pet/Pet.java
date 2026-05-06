package com.petlifelog.backend.domain.pet;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import com.petlifelog.backend.domain.member.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "pets")
public class Pet extends BaseTimeEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    @Column(nullable = false)
    private String name;

    private String breed;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "adoption_date")
    private LocalDate adoptionDate;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "profile_image_path")
    private String profileImagePath;

    @Column(columnDefinition = "TEXT")
    private String personality;

    @Column(columnDefinition = "TEXT")
    private String appearance;

    @Column(columnDefinition = "TEXT")
    private String likes;

    @Column(columnDefinition = "TEXT")
    private String dislikes;

    @Column(name = "diary_tone", columnDefinition = "TEXT")
    private String diaryTone;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder
    public Pet(Member user, String name, String breed, LocalDate birthDate, LocalDate adoptionDate,
               Gender gender, BigDecimal weightKg, String profileImagePath, String personality,
               String appearance, String likes, String dislikes, String diaryTone) {
        this.user = user;
        this.name = name;
        this.breed = breed;
        this.birthDate = birthDate;
        this.adoptionDate = adoptionDate;
        this.gender = gender;
        this.weightKg = weightKg;
        this.profileImagePath = profileImagePath;
        this.personality = personality;
        this.appearance = appearance;
        this.likes = likes;
        this.dislikes = dislikes;
        this.diaryTone = diaryTone;
        this.isActive = true;
    }

    public void update(String name, String breed, LocalDate birthDate, Gender gender, String profileImagePath, String personality) {
        this.name = name;
        this.breed = breed;
        this.birthDate = birthDate;
        this.gender = gender;
        this.profileImagePath = profileImagePath;
        this.personality = personality;
    }

    public void updateAll(String name, String breed, LocalDate birthDate, LocalDate adoptionDate,
                          Gender gender, BigDecimal weightKg, String profileImagePath, String personality,
                          String appearance, String likes, String dislikes, String diaryTone) {
        this.name = name;
        this.breed = breed;
        this.birthDate = birthDate;
        this.adoptionDate = adoptionDate;
        this.gender = gender;
        this.weightKg = weightKg;
        this.profileImagePath = profileImagePath;
        this.personality = personality;
        this.appearance = appearance;
        this.likes = likes;
        this.dislikes = dislikes;
        this.diaryTone = diaryTone;
    }

    public void delete() {
        this.isActive = false;
    }
}
