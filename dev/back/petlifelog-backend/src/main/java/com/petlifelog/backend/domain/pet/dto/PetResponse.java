package com.petlifelog.backend.domain.pet.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.petlifelog.backend.domain.pet.Gender;
import com.petlifelog.backend.domain.pet.Pet;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class PetResponse {
    private UUID id;
    private String name;
    private String breed;
    
    @JsonProperty("birthDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;
    
    @JsonProperty("adoptionDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate adoptionDate;
    
    private Gender gender;
    
    @JsonProperty("weightKg")
    private BigDecimal weightKg;
    
    private String photo;
    private String traits;
    private String appearance;
    private String likes;
    private String dislikes;
    
    @JsonProperty("diaryTone")
    private String diaryTone;
    
    @JsonProperty("addedAt")
    private String addedAt;

    public static PetResponse from(Pet pet) {
        return PetResponse.builder()
                .id(pet.getId())
                .name(pet.getName())
                .breed(pet.getBreed())
                .birthDate(pet.getBirthDate())
                .adoptionDate(pet.getAdoptionDate())
                .gender(pet.getGender())
                .weightKg(pet.getWeightKg())
                .photo(pet.getProfileImagePath())
                .traits(pet.getPersonality())
                .appearance(pet.getAppearance())
                .likes(pet.getLikes())
                .dislikes(pet.getDislikes())
                .diaryTone(pet.getDiaryTone())
                .addedAt(pet.getCreatedAt() != null ? 
                        pet.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString() : 
                        java.time.LocalDate.now().toString())
                .build();
    }
}
