package com.petlifelog.backend.domain.pet.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.petlifelog.backend.domain.pet.Gender;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class PetRequest {
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
}
