package com.petlifelog.backend.common.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.petlifelog.backend.domain.ai.dto.AnalyzeProductResult;
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

    /**
     * Step 1: 이미지에서 텍스트만 있는 그대로 읽어 반환 (OCR only, 추측 금지)
     */
    public String ocrProductImages(List<String> base64Images) {
        String apiUrl = String.format("%s/models/%s:generateContent?key=%s", baseUrl, model, apiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", buildOcrPrompt()));
        for (String base64Image : base64Images) {
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mime_type", "image/jpeg");
            inlineData.put("data", base64Image);
            parts.add(Map.of("inline_data", inlineData));
        }

        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("parts", parts);
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contentMap));

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);

            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                String rawText = (String) resParts.get(0).get("text");
                log.info("Gemini OCR Result:\n{}", rawText);
                return rawText;
            }
        } catch (Exception e) {
            log.error("Gemini OCR call failed", e);
            throw new RuntimeException("AI OCR 중 오류가 발생했습니다: " + e.getMessage());
        }

        return "";
    }

    /**
     * Step 2: OCR 텍스트만 입력받아 구조화 JSON 추출 (이미지 없음 → 환각 차단)
     */
    public AnalyzeProductResult extractProductInfoFromText(String ocrText) {
        String apiUrl = String.format("%s/models/%s:generateContent?key=%s", baseUrl, model, apiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = buildExtractionPrompt(ocrText);
        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("parts", List.of(Map.of("text", prompt)));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("response_mime_type", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contentMap));
        requestBody.put("generationConfig", generationConfig);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);

            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                String contentString = (String) resParts.get(0).get("text");
                log.info("Gemini Extraction Result: {}", contentString);
                return objectMapper.readValue(contentString, AnalyzeProductResult.class);
            }
        } catch (Exception e) {
            log.error("Gemini extraction call failed", e);
            throw new RuntimeException("AI 정보 추출 중 오류가 발생했습니다: " + e.getMessage());
        }

        return null;
    }

    public String generateText(String prompt) {
        String apiUrl = String.format("%s/models/%s:generateContent?key=%s", baseUrl, model, apiKey);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("parts", List.of(Map.of("text", prompt)));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("response_mime_type", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(contentMap));
        requestBody.put("generationConfig", generationConfig);

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);

            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                String result = (String) resParts.get(0).get("text");
                log.info("Gemini Text Response: {}", result);
                return result;
            }
        } catch (Exception e) {
            log.error("Gemini text generation failed", e);
            throw new RuntimeException("AI 리포트 생성 중 오류가 발생했습니다: " + e.getMessage());
        }
        return null;
    }

    private String buildOcrPrompt() {
        return "너는 이미지 OCR 전문가다. 제공된 이미지에서 보이는 텍스트를 있는 그대로 나열하라.\n\n"
                + "규칙:\n"
                + "- 이미지에 실제로 인쇄된 텍스트만 출력한다.\n"
                + "- 절대 추측하거나 보완하지 않는다. 읽히지 않으면 쓰지 않는다.\n"
                + "- 흐리거나 겹쳐서 읽기 어려운 부분은 [불명확]으로 표시한다.\n"
                + "- 텍스트 위치 구분을 위해 줄바꿈을 사용한다.\n"
                + "- JSON, 마크다운, 설명 없이 순수 텍스트만 출력한다.\n"
                + "- 이미지에 없는 내용은 한 글자도 추가하지 않는다.";
    }

    private String buildExtractionPrompt(String ocrText) {
        return "너는 반려동물 제품 정보 추출 전문가다.\n"
                + "아래 [OCR 텍스트]는 제품 포장에서 읽어낸 원문이다. 이 텍스트에 있는 내용만 사용해 JSON을 만들어라.\n\n"

                + "# 절대 원칙\n"
                + "- [OCR 텍스트]에 없는 내용은 어떤 필드에도 절대 넣지 않는다.\n"
                + "- 일반 상식, 도메인 지식, 추측을 사용하지 않는다.\n"
                + "- 텍스트에 있으면 그대로 추출하고, 없으면 null 또는 빈 배열이다.\n"
                + "- [불명확] 표시된 부분은 candidates에만 넣고 value는 null로 둔다.\n\n"

                + "# 제품명 규칙\n"
                + "- 브랜드명, 광고 문구, 맛/원료명, 카테고리 문구는 제품명이 아니다.\n"
                + "- 제품명이 텍스트에 명확히 있으면 name.value에, 애매하면 null로 두고 candidates에 후보를 넣어라.\n\n"

                + "# 맛(flavor) 규칙\n"
                + "- '닭가슴살맛', '연어맛', '오리맛', '소고기맛' 등 '[재료]맛' 형식의 텍스트를 찾는다.\n"
                + "- 텍스트에 맛 표기가 있으면 '닭가슴살', '연어' 처럼 맛 이름만 추출한다 (맛 제외).\n"
                + "- 원재료명이 곧 맛을 나타내는 경우(예: '100% 닭가슴살')도 flavor로 추출할 수 있다.\n"
                + "- 텍스트에 맛 표기가 없으면 flavor.value는 null이다.\n\n"

                + "# 성분 규칙\n"
                + "- '원재료명', '원료', '성분' 라벨 뒤에 나열된 항목만 ingredients로 추출한다.\n"
                + "- 텍스트에 그 라벨이 없으면 ingredients.value는 빈 배열, ingredientsText.value는 null이다.\n\n"

                + "# 날짜 규칙\n"
                + "- '유통기한'/'소비기한' 뒤 날짜 → expiryDateSpecific (YYYY-MM-DD 변환)\n"
                + "- '제조일로부터 N개월' 형식 → expiryDateText에 원문 그대로\n"
                + "- '제조일자' 뒤 날짜 → productionDate\n"
                + "- 날짜가 텍스트에 없으면 해당 필드는 null이다.\n\n"

                + "# 보관방법 규칙\n"
                + "- 냉장/냉동/상온 키워드가 텍스트에 있으면 해당 값으로, source는 EXPLICIT\n"
                + "- 텍스트에 없으면 ROOM_TEMP, source는 DEFAULT\n\n"

                + "# 급여방법 규칙\n"
                + "- '급여방법', '급여량', '권장 급여량' 라벨 뒤 내용만 추출한다.\n"
                + "- 텍스트에 그 라벨이 없으면 suggestedUsage.value는 반드시 null이다.\n\n"

                + "# 카테고리 규칙\n"
                + "- FOOD(사료/주식) / SNACK(간식/트릿/육포/져키) / HEALTH(영양제) / TOY(장난감) / CLOTHES(의류) / ETC\n"
                + "- 텍스트의 단서로 판단하고, 애매하면 ETC\n\n"

                + "# Confidence 규칙\n"
                + "- 0.9 이상: 텍스트에서 명확히 읽힘\n"
                + "- 0.7 이상: 텍스트에 있으나 사용자 확인 권장\n"
                + "- 0.5 미만: 불명확, value는 null\n"
                + "- name/brand/ingredients/날짜가 불확실하면 reviewFields에 추가\n\n"

                + "# [OCR 텍스트]\n"
                + ocrText + "\n\n"

                + "# 출력 형식 (Strict JSON only)\n"
                + "{\n"
                + "  \"category\": { \"value\": \"FOOD|SNACK|TOY|HEALTH|CLOTHES|ETC\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT|INFERRED|DEFAULT\" },\n"
                + "  \"name\": { \"value\": \"제품명 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"brand\": { \"value\": \"브랜드명 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"flavor\": { \"value\": \"맛 이름 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"productionDate\": { \"value\": \"YYYY-MM-DD 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"expiryDateText\": { \"value\": \"원문 그대로 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"expiryDateSpecific\": { \"value\": \"YYYY-MM-DD 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"ingredientsText\": { \"value\": \"원재료명 전체 원문 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"ingredients\": { \"value\": [], \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"material\": { \"value\": \"소재 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"size\": { \"value\": \"용량/크기 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"storageMethod\": { \"value\": \"ROOM_TEMP|REFRIGERATED|FROZEN\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"EXPLICIT|DEFAULT\" },\n"
                + "  \"suggestedUsage\": { \"value\": \"급여방법 또는 null\", \"candidates\": [], \"confidence\": 0.0, \"source\": \"TEXT\" },\n"
                + "  \"reviewFields\": [],\n"
                + "  \"warnings\": []\n"
                + "}";
    }
}
