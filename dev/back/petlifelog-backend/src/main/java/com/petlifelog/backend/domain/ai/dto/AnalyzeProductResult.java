package com.petlifelog.backend.domain.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AnalyzeProductResult {
    private AiField<String> category;
    private AiField<String> name;
    private AiField<String> brand;
    private AiField<String> flavor;
    private AiField<String> productionDate;
    private AiField<String> expiryDateText;
    private AiField<String> expiryDateSpecific;
    private AiField<String> ingredientsText;
    private AiField<List<String>> ingredients;
    private AiField<String> material;
    private AiField<String> size;
    private AiField<String> storageMethod;
    private AiField<String> suggestedUsage;
    private List<String> reviewFields;
    private List<String> warnings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AiField<T> {
        private T value;
        private List<T> candidates;
        private double confidence;
        private String source;
    }
}
