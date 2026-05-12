package com.petlifelog.backend.domain.dashboard;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petlifelog.backend.common.ai.GeminiClient;
import com.petlifelog.backend.common.exception.AiRateLimitException;
import com.petlifelog.backend.domain.ai.AiDiaryUsage;
import com.petlifelog.backend.domain.ai.AiDiaryUsageRepository;
import com.petlifelog.backend.domain.dashboard.dto.AiReportResponse;
import com.petlifelog.backend.domain.dashboard.dto.AiReportResponse.*;
import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.MemberRepository;
import com.petlifelog.backend.domain.memory.Memory;
import com.petlifelog.backend.domain.memory.MemoryMomentRepository;
import com.petlifelog.backend.domain.memory.MemoryRepository;
import com.petlifelog.backend.domain.pet.Pet;
import com.petlifelog.backend.domain.pet.PetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@Service
public class AiDashboardService {

    private static final int MIN_MEMORIES_REQUIRED = 3;
    private static final int DASHBOARD_REFRESH_LIMIT = 3;
    private static final String USAGE_TYPE_DASHBOARD = "DASHBOARD_REFRESH";
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    private final GeminiClient geminiClient;
    private final MemberRepository memberRepository;
    private final PetRepository petRepository;
    private final MemoryRepository memoryRepository;
    private final MemoryMomentRepository memoryMomentRepository;
    private final DashboardReportRepository dashboardReportRepository;
    private final AiDiaryUsageRepository aiDiaryUsageRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiReportResponse getOrGenerateReport(UUID userId, UUID petId, String yearMonth) {
        String currentYearMonth = YearMonth.now().format(MONTH_FORMATTER);
        boolean isPreviousMonth = !yearMonth.equals(currentYearMonth);

        Optional<DashboardReport> cached = findCached(userId, petId, yearMonth);
        if (cached.isPresent()) {
            return toResponse(cached.get(), remainingRefreshCount(userId));
        }

        // 이전 달은 자동 생성하지 않음 — 기록 수 확인 후 안내만 반환
        if (isPreviousMonth) {
            YearMonth ym = YearMonth.parse(yearMonth, MONTH_FORMATTER);
            List<Memory> memories = memoryRepository.findWithMomentsByUserAndDateRange(
                    userId, ym.atDay(1), ym.atEndOfMonth(), petId);
            return AiReportResponse.builder()
                    .reportYearMonth(yearMonth)
                    .hasData(false)
                    .recordCount(memories.size())
                    .remainingRefreshCount(remainingRefreshCount(userId))
                    .build();
        }

        return generateAndSave(userId, petId, yearMonth);
    }

    @Transactional
    public AiReportResponse refreshReport(UUID userId, UUID petId, String yearMonth) {
        int remaining = remainingRefreshCount(userId);
        if (remaining <= 0) {
            throw AiRateLimitException.dashboardRefreshLimitExceeded();
        }

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        aiDiaryUsageRepository.save(AiDiaryUsage.builder()
                .member(member)
                .targetDate(LocalDate.now())
                .calledAt(LocalDateTime.now())
                .usageType(USAGE_TYPE_DASHBOARD)
                .build());

        findCached(userId, petId, yearMonth).ifPresent(dashboardReportRepository::delete);
        return generateAndSave(userId, petId, yearMonth);
    }

    private int remainingRefreshCount(UUID userId) {
        long used = aiDiaryUsageRepository.countByMember_IdAndUsageTypeAndTargetDate(
                userId, USAGE_TYPE_DASHBOARD, LocalDate.now());
        return (int) Math.max(0, DASHBOARD_REFRESH_LIMIT - used);
    }

    private Optional<DashboardReport> findCached(UUID userId, UUID petId, String yearMonth) {
        if (petId == null) {
            return dashboardReportRepository.findByUser_IdAndPetIsNullAndReportYearMonth(userId, yearMonth);
        }
        return dashboardReportRepository.findByUser_IdAndPet_IdAndReportYearMonth(userId, petId, yearMonth);
    }

    // ─── 생성 메인 로직 ──────────────────────────────────────────────────────

    private AiReportResponse generateAndSave(UUID userId, UUID petId, String yearMonth) {
        YearMonth ym = YearMonth.parse(yearMonth, MONTH_FORMATTER);
        LocalDate monthStart = ym.atDay(1);
        LocalDate monthEnd = ym.atEndOfMonth();
        LocalDate today = LocalDate.now();

        List<Memory> memories = memoryRepository.findWithMomentsByUserAndDateRange(
                userId, monthStart, monthEnd, petId);

        if (memories.size() < MIN_MEMORIES_REQUIRED) {
            return AiReportResponse.builder()
                    .reportYearMonth(yearMonth)
                    .hasData(false)
                    .recordCount(memories.size())
                    .remainingRefreshCount(remainingRefreshCount(userId))
                    .build();
        }

        // ── 1. 장소 통계 계산 (이번 달 데이터만) ─────────────────────────────
        List<Object[]> locationStats = memoryMomentRepository.findLocationEnergyStats(
                userId, petId, monthStart, monthEnd);
        LocationCalc locationCalc = calcLocationVerdict(locationStats);

        // ── 2. 에너지 통계 계산 ───────────────────────────────────────────────
        LocalDate twoWeeksAgo  = today.minusDays(14);
        LocalDate fourWeeksAgo = today.minusDays(28);
        Double monthAvg    = memoryMomentRepository.findAvgEnergyLevel(userId, petId, monthStart, monthEnd);
        Double recentAvg   = memoryMomentRepository.findAvgEnergyLevel(userId, petId, twoWeeksAgo, today);
        Double previousAvg = memoryMomentRepository.findAvgEnergyLevel(userId, petId, fourWeeksAgo, twoWeeksAgo.minusDays(1));
        ActivityCalc activityCalc = calcActivityInsight(memories.size(), monthAvg, recentAvg, previousAvg);

        // ── 3. 카테고리 분포 계산 ─────────────────────────────────────────────
        List<Object[]> categoryDist = memoryMomentRepository.findCategoryDistribution(
                userId, petId, monthStart, monthEnd);

        List<Pet> pets = petId != null
                ? petRepository.findById(petId).map(List::of).orElse(List.of())
                : petRepository.findByUserIdAndIsActiveTrue(userId);

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        String userAiContext = member.getAiContext();

        String prompt = buildPrompt(pets, memories, activityCalc, locationCalc, categoryDist, yearMonth, userAiContext);

        try {
            String jsonResponse = geminiClient.generateText(prompt);
            Map<String, Object> parsed = objectMapper.readValue(jsonResponse, new TypeReference<>() {});
            DashboardReport report = saveReport(userId, petId, yearMonth, parsed, activityCalc, locationCalc);
            return toResponse(report, remainingRefreshCount(userId));
        } catch (Exception e) {
            log.error("AI 대시보드 리포트 생성 실패", e);
            return AiReportResponse.builder().reportYearMonth(yearMonth).hasData(false)
                    .remainingRefreshCount(remainingRefreshCount(userId)).build();
        }
    }

    // ─── 장소 판정 (백엔드 계산) ─────────────────────────────────────────────

    record LocationCalc(
            String verdict,
            int placeRecordCount,
            int uniquePlaceCount,
            String topPlace,
            List<Object[]> locationStats
    ) {}

    private LocationCalc calcLocationVerdict(List<Object[]> locationStats) {
        int uniquePlaceCount = locationStats.size();
        int placeRecordCount = locationStats.stream()
                .mapToInt(r -> ((Number) r[2]).intValue())
                .sum();

        if (placeRecordCount < 2) {
            String topPlace = uniquePlaceCount > 0 ? (String) locationStats.get(0)[0] : null;
            return new LocationCalc("LOW_DATA", placeRecordCount, uniquePlaceCount, topPlace, locationStats);
        }

        String topPlace = (String) locationStats.get(0)[0];
        int topCount = ((Number) locationStats.get(0)[2]).intValue();
        double topRatio = (double) topCount / placeRecordCount;
        double diversityRatio = (double) uniquePlaceCount / placeRecordCount;

        String verdict;
        if (diversityRatio >= 0.7) {
            verdict = "VARIED";
        } else if (topRatio >= 0.6) {
            verdict = "FOCUSED";
        } else {
            boolean hasRepeat = locationStats.stream().anyMatch(r -> ((Number) r[2]).intValue() >= 2);
            verdict = hasRepeat ? "ROUTINE" : "VARIED";
        }

        return new LocationCalc(verdict, placeRecordCount, uniquePlaceCount, topPlace, locationStats);
    }

    // ─── 에너지 판정 (백엔드 계산) ───────────────────────────────────────────

    record ActivityCalc(
            Double averageEnergy,
            Double recentAvg,
            Double previousAvg,
            Double diff,
            String trend,
            String level,
            String confidence
    ) {}

    private ActivityCalc calcActivityInsight(int memoryCount, Double monthAvg, Double recentAvg, Double previousAvg) {
        // confidence
        String confidence;
        if (memoryCount >= 7) confidence = "HIGH";
        else if (memoryCount >= 3) confidence = "LOW";
        else confidence = "NONE";

        if (recentAvg == null) {
            return new ActivityCalc(monthAvg, null, null, null, "UNKNOWN", "UNKNOWN", confidence);
        }

        // trend
        String trend;
        Double diff = null;
        if (previousAvg == null) {
            trend = "UNKNOWN";
        } else {
            diff = recentAvg - previousAvg;
            if (diff >= 0.4) trend = "UP";
            else if (diff <= -0.4) trend = "DOWN";
            else trend = "STABLE";
        }

        // level
        String level;
        if (recentAvg >= 4.0) level = "GREAT";
        else if (recentAvg >= 2.8) level = "NORMAL";
        else if (recentAvg >= 2.4) level = "WATCH";
        else level = "WARNING";

        // 큰 하락이면 WARNING으로 상향
        if (diff != null && diff <= -0.8) level = "WARNING";

        return new ActivityCalc(monthAvg, recentAvg, previousAvg, diff, trend, level, confidence);
    }

    // ─── 저장 ────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private DashboardReport saveReport(UUID userId, UUID petId, String yearMonth,
                                       Map<String, Object> parsed,
                                       ActivityCalc ac, LocationCalc lc) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        Pet pet = petId != null ? petRepository.findById(petId).orElse(null) : null;

        Map<String, Object> monthly  = (Map<String, Object>) parsed.get("monthlyReport");
        Map<String, Object> personality = (Map<String, Object>) parsed.get("personalityInsight");
        Map<String, Object> activity = (Map<String, Object>) parsed.get("activityInsight");
        Map<String, Object> location = (Map<String, Object>) parsed.get("locationInsight");

        String highlightsJson = toJson(monthly.get("highlights"));
        String tagsJson       = toJson(monthly.get("tags"));

        return dashboardReportRepository.save(DashboardReport.builder()
                .user(member).pet(pet).reportYearMonth(yearMonth)
                .monthlyHeadline((String) monthly.get("headline"))
                .monthlyNarrative((String) monthly.get("narrative"))
                .monthlyHighlightsJson(highlightsJson)
                .monthlyTagsJson(tagsJson)
                .personalityType((String) personality.get("type"))
                .personalityLabel((String) personality.get("label"))
                .personalityMessage((String) personality.get("message"))
                .activityAverageEnergy(ac.averageEnergy())
                .activityRecentAvg(ac.recentAvg())
                .activityPreviousAvg(ac.previousAvg())
                .activityDiff(ac.diff())
                .activityTrend(ac.trend())
                .activityLevel(ac.level())
                .activityConfidence(ac.confidence())
                .activityMessage((String) activity.get("message"))
                .locationVerdict(lc.verdict())
                .locationPlaceRecordCount(lc.placeRecordCount())
                .locationUniquePlaceCount(lc.uniquePlaceCount())
                .locationTopPlace(lc.topPlace())
                .locationMessage((String) location.get("message"))
                .guardianMessage(getString(parsed, "guardianMessage"))
                .nextSuggestion(getString(parsed, "nextSuggestion"))
                .build());
    }

    // ─── 응답 변환 ───────────────────────────────────────────────────────────

    private AiReportResponse toResponse(DashboardReport r, int remainingRefreshCount) {
        List<HighlightItem> highlights = parseHighlights(r.getMonthlyHighlightsJson());
        List<String> tags = parseStringList(r.getMonthlyTagsJson());

        return AiReportResponse.builder()
                .reportYearMonth(r.getReportYearMonth())
                .generatedAt(r.getGeneratedAt())
                .hasData(true)
                .remainingRefreshCount(remainingRefreshCount)
                .monthlyReport(MonthlyReportSection.builder()
                        .headline(r.getMonthlyHeadline())
                        .narrative(r.getMonthlyNarrative())
                        .highlights(highlights)
                        .tags(tags)
                        .build())
                .personalityInsight(PersonalityInsightSection.builder()
                        .type(r.getPersonalityType())
                        .label(r.getPersonalityLabel())
                        .message(r.getPersonalityMessage())
                        .build())
                .activityInsight(ActivityInsightSection.builder()
                        .averageEnergy(r.getActivityAverageEnergy())
                        .recentAverage(r.getActivityRecentAvg())
                        .previousAverage(r.getActivityPreviousAvg())
                        .diff(r.getActivityDiff())
                        .trend(r.getActivityTrend())
                        .level(r.getActivityLevel())
                        .confidence(r.getActivityConfidence())
                        .message(r.getActivityMessage())
                        .build())
                .locationInsight(LocationInsightSection.builder()
                        .verdict(r.getLocationVerdict())
                        .placeRecordCount(r.getLocationPlaceRecordCount())
                        .uniquePlaceCount(r.getLocationUniquePlaceCount())
                        .topPlace(r.getLocationTopPlace())
                        .message(r.getLocationMessage())
                        .build())
                .guardianMessage(r.getGuardianMessage())
                .nextSuggestion(r.getNextSuggestion())
                .build();
    }

    // ─── 프롬프트 ────────────────────────────────────────────────────────────

    private String buildPrompt(List<Pet> pets, List<Memory> memories,
                               ActivityCalc ac, LocationCalc lc,
                               List<Object[]> categoryDist, String yearMonth,
                               String userAiContext) {
        StringBuilder sb = new StringBuilder();
        if (userAiContext != null && !userAiContext.isBlank()) {
            sb.append("【보호자 개인 컨텍스트 — 리포트 작성 시 항상 반영할 것】\n");
            sb.append(userAiContext).append("\n\n");
        }
        sb.append("당신은 반려동물 월간 리포트 작성 전문가입니다.\n");
        sb.append("아래 분석 결과를 바탕으로 자연스러운 문장을 작성해주세요.\n");
        sb.append("수치는 이미 계산되어 있으니, 계산은 하지 말고 문장만 작성하세요.\n\n");

        // 반려동물 정보
        sb.append("【반려동물 정보】\n");
        if (pets.isEmpty()) {
            sb.append("반려동물 정보 없음\n\n");
        } else if (pets.size() == 1) {
            Pet pet = pets.get(0);
            sb.append(String.format("이름: %s, 품종: %s\n\n",
                    pet.getName(), pet.getBreed() != null ? pet.getBreed() : "미상"));
        } else {
            sb.append("전체 반려동물 기준 리포트입니다.\n");
            for (Pet pet : pets) {
                sb.append(String.format("- %s (%s)\n",
                        pet.getName(), pet.getBreed() != null ? pet.getBreed() : "미상"));
            }
            sb.append("※ 특정 반려동물 이름을 단독으로 언급하지 말고 '우리 아이들', '반려동물들' 등으로 표현하세요.\n\n");
        }

        // 이번 달 기록 목록
        sb.append(String.format("【%s 기록 목록】\n", yearMonth));
        for (Memory m : memories) {
            sb.append(String.format("- %s: \"%s\"\n", m.getMemoryDate(), m.getAiTitle()));
        }
        sb.append("\n");

        // 활동 카테고리 분포
        Map<String, Long> catMap = categoryDist.stream()
                .collect(Collectors.toMap(r -> (String) r[0], r -> ((Number) r[1]).longValue()));
        sb.append("【활동 유형 분포】\n");
        sb.append(String.format("야외활동(ACTIVITY): %d건 / 일상(GENERAL): %d건 / 건강(HEALTH): %d건\n\n",
                catMap.getOrDefault("ACTIVITY", 0L),
                catMap.getOrDefault("GENERAL", 0L),
                catMap.getOrDefault("HEALTH", 0L)));

        // 장소 분석 (백엔드 계산 결과)
        sb.append("【이번 달 장소 기록 요약 (이미 계산됨)】\n");
        sb.append("※ 이번 달 기록 안에서만 계산된 값입니다.\n");
        sb.append("※ 과거 기록과 비교하지 말고, '처음 가본 곳', '익숙한 곳'이라는 표현은 절대 사용하지 마세요.\n");
        sb.append(String.format("이번 달 장소별 방문 날짜 수 합계: %d건 (같은 날 같은 장소 모멘트 여러 개 = 1건)\n", lc.placeRecordCount()));
        sb.append(String.format("이번 달 고유 장소 수: %d곳\n", lc.uniquePlaceCount()));
        if (lc.topPlace() != null) sb.append(String.format("가장 많이 등장한 장소: %s\n", lc.topPlace()));
        sb.append(String.format("장소 흐름 판정: %s\n", lc.verdict()));
        if (!lc.locationStats().isEmpty()) {
            sb.append("장소별 등장 횟수 / 평균 에너지:\n");
            for (Object[] row : lc.locationStats()) {
                sb.append(String.format("  - %s: %d회 / 평균 에너지 %.1f\n",
                        row[0], ((Number) row[2]).intValue(), ((Number) row[1]).doubleValue()));
            }
        }
        sb.append("\n");

        // 에너지 분석 (백엔드 계산 결과)
        sb.append("【활동 에너지 분석 (이미 계산됨)】\n");
        if (ac.averageEnergy() != null) {
            sb.append(String.format("이번 달 전체 평균 에너지: %.1f/5\n", ac.averageEnergy()));
        }
        if (ac.recentAvg() != null) {
            sb.append(String.format("최근 2주 평균: %.1f\n", ac.recentAvg()));
        }
        if (ac.previousAvg() != null) {
            sb.append(String.format("이전 2주 평균: %.1f\n", ac.previousAvg()));
        }
        if (ac.diff() != null) {
            sb.append(String.format("변화량(diff): %+.1f\n", ac.diff()));
        }
        sb.append(String.format("trend: %s / level: %s / confidence: %s\n\n",
                ac.trend(), ac.level(), ac.confidence()));

        // 작성 규칙
        sb.append("【작성 규칙】\n");
        sb.append("1. '처음 가본 곳', '익숙한 곳', '새로운 곳' 표현 절대 금지\n");
        sb.append("2. WARNING/WATCH 레벨이어도 과도한 걱정 표현 금지 ('관찰 필요' 정도로)\n");
        sb.append("3. confidence가 LOW이면 '~로 보입니다', '~흐름이 있어요' 등 완화 표현 사용\n");
        sb.append("4. confidence가 NONE이면 에너지 분석 문장에서 단정적 표현 금지\n");
        sb.append("5. trend가 UNKNOWN이면 비교 없이 현재 상태만 서술\n");
        sb.append("6. locationInsight.message는 verdict 결과를 자연스럽게 풀어서 작성\n");
        sb.append("7. personalityInsight: 이번 달 활동 패턴 전체를 보고 하나의 성향 키워드로 표현\n");
        sb.append("8. nextSuggestion: 다음 달 기록을 더 풍부하게 만들 수 있는 팁 (명령형 아닌 권유형)\n\n");

        sb.append("반드시 아래 JSON 형식으로만 응답 (다른 텍스트 금지):\n");
        sb.append("""
                {
                  "monthlyReport": {
                    "headline": "이달의 제목",
                    "narrative": "3~4문장 회고",
                    "highlights": [
                      {"title": "하이라이트 제목", "date": "YYYY-MM-DD", "reason": "선정 이유"}
                    ],
                    "tags": ["이번달을 대표하는 키워드1", "키워드2"]
                  },
                  "personalityInsight": {
                    "type": "NATURE_LOVER|SOCIAL|HOMEBODY|ADVENTURER|ROUTINE_KEEPER",
                    "label": "자연 산책형 (2~4자)",
                    "message": "이번 달 성향 한 줄"
                  },
                  "activityInsight": {
                    "message": "활동 에너지에 대한 자연스러운 1~2문장 (수치 직접 언급 가능)"
                  },
                  "locationInsight": {
                    "message": "장소 흐름에 대한 자연스러운 1~2문장"
                  },
                  "guardianMessage": "보호자에게 전하는 따뜻한 한 줄",
                  "nextSuggestion": "다음 달 기록 팁 한 줄"
                }
                """);

        return sb.toString();
    }

    // ─── 유틸 ────────────────────────────────────────────────────────────────

    private String toJson(Object obj) {
        try { return objectMapper.writeValueAsString(obj); } catch (Exception e) { return "[]"; }
    }

    @SuppressWarnings("unchecked")
    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof String s) return s;
        if (val instanceof Map<?, ?> m) return (String) m.get("message");
        return null;
    }

    @SuppressWarnings("unchecked")
    private List<HighlightItem> parseHighlights(String json) {
        try {
            List<Map<String, String>> raw = objectMapper.readValue(json, new TypeReference<>() {});
            return raw.stream()
                    .map(m -> HighlightItem.builder()
                            .title(m.get("title"))
                            .date(m.get("date"))
                            .reason(m.get("reason"))
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) { return List.of(); }
    }

    private List<String> parseStringList(String json) {
        try { return objectMapper.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return List.of(); }
    }
}
