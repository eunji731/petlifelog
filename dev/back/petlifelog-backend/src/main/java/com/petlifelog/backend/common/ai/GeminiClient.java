package com.petlifelog.backend.common.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.petlifelog.backend.domain.ai.dto.DailyLogResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Component
public class GeminiClient {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model}")
    private String model;

    @Value("${gemini.url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper;

    public DailyLogResponse analyzeImages(List<String> base64Images, String prompt) {
        // v1/models/gemini-1.5-flash:generateContent?key=... 형식으로 호출
        String apiUrl = String.format("%s/models/%s:generateContent?key=%s", baseUrl, model, apiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Native Gemini Request Structure
        Map<String, Object> requestBody = new HashMap<>();
        
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentMap = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();

        // Add Text Part
        parts.add(Map.of("text", "당신은 반려동물 전문 일기 작가입니다. 제공된 사진들과 메타데이터를 분석하여 반려동물의 시점에서 생생하고 감성적인 일기를 작성해주세요. 응답은 반드시 JSON 형식이어야 합니다.\n\n" + prompt));

        // Add Image Parts
        for (String base64Image : base64Images) {
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mime_type", "image/jpeg");
            inlineData.put("data", base64Image);
            parts.add(Map.of("inline_data", inlineData));
        }

        contentMap.put("parts", parts);
        contents.add(contentMap);
        requestBody.put("contents", contents);

        // Generation Config for JSON Mode
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("response_mime_type", "application/json");
        requestBody.put("generationConfig", generationConfig);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);

            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                Map<String, Object> firstCandidate = candidates.get(0);
                Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                String contentString = (String) resParts.get(0).get("text");
                
                log.info("Gemini Native Response: {}", contentString);
                return objectMapper.readValue(contentString, DailyLogResponse.class);
            }
        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            throw new RuntimeException("AI 분석 중 오류가 발생했습니다: " + e.getMessage());
        }

        return null;
    }
}
