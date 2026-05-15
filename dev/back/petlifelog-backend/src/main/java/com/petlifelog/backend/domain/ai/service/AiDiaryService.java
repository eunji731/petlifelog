package com.petlifelog.backend.domain.ai.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petlifelog.backend.common.ai.GeminiClient;
import com.petlifelog.backend.common.exception.AiRateLimitException;
import com.petlifelog.backend.common.file.domain.AttachedFile;
import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.dto.StoredFileInfo;
import com.petlifelog.backend.common.file.service.AttachedFileService;
import com.petlifelog.backend.common.file.service.FileStorageService;
import com.petlifelog.backend.domain.ai.domain.AiDiaryUsage;
import com.petlifelog.backend.domain.ai.dto.*;
import com.petlifelog.backend.domain.ai.repository.AiDiaryUsageRepository;
import com.petlifelog.backend.domain.member.domain.Member;
import com.petlifelog.backend.domain.member.repository.MemberRepository;
import com.petlifelog.backend.domain.memory.domain.*;
import com.petlifelog.backend.domain.memory.repository.*;
import com.petlifelog.backend.domain.pet.domain.Pet;
import com.petlifelog.backend.domain.pet.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class AiDiaryService {

    private static final int DATE_LIMIT = 2;
    private static final int DAILY_LIMIT = 10;

    private final GeminiClient geminiClient;
    private final PetRepository petRepository;
    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final PhotoRepository photoRepository;
    private final MemoryMomentRepository memoryMomentRepository;
    private final MemoryDogRepository memoryDogRepository;
    private final ObjectMapper objectMapper;
    private final FileStorageService fileStorageService;
    private final AttachedFileService attachedFileService;
    private final AiDiaryUsageRepository aiDiaryUsageRepository;
    private final PhotoThemeTagRepository photoThemeTagRepository;

    @Transactional
    public AnalyzeDiaryResult analyzeDiary(UUID userId, LocalDate targetDate,
                                           List<MultipartFile> images,
                                           String petInfoJson,
                                           List<String> userTags) {
        checkRateLimit(userId, targetDate);

        try {
            List<PetInfoRequest> petInfos = objectMapper.readValue(
                    petInfoJson, new TypeReference<List<PetInfoRequest>>() {});

            UUID sessionId = UUID.randomUUID();

            List<StoredFileInfo> storedFiles = new ArrayList<>();
            List<String> base64Images = new ArrayList<>();
            List<String> metadataLines = new ArrayList<>();

            for (MultipartFile file : images) {
                String storedPath = fileStorageService.store(file, ParentDomainType.MEMORY, sessionId);

                ExifMeta exif = extractExif(file, file.getOriginalFilename());

                storedFiles.add(StoredFileInfo.builder()
                        .originalName(file.getOriginalFilename())
                        .storedPath(storedPath)
                        .fileUrl(fileStorageService.getFileUrl(storedPath))
                        .contentType(file.getContentType())
                        .fileSize(file.getSize())
                        .takenAt(exif.takenAt)
                        .latitude(exif.lat)
                        .longitude(exif.lng)
                        .build());

                metadataLines.add(String.format("- 파일명: %s, 촬영시간: %s, 위치: %s",
                        file.getOriginalFilename(),
                        exif.takenAt != null ? exif.takenAt : "알수없음",
                        exif.lat != null ? exif.lat + ", " + exif.lng : "알수없음"));

                try (InputStream is = fileStorageService.getInputStream(storedPath)) {
                    base64Images.add(resizeAndEncodeToBase64(is));
                }
            }

            String petContext = preparePetContext(petInfos);
            String metadataContext = String.join("\n", metadataLines);
            log.info("AI에 전달되는 메타데이터:\n{}", metadataContext);

            Member member = memberRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            String userAiContext = member.getAiContext();

            String prompt = buildPrompt(petContext, metadataContext, userTags, userAiContext);
            DailyLogResponse aiResult = geminiClient.analyzeImages(base64Images, prompt);

            recordUsage(userId, targetDate);

            return AnalyzeDiaryResult.builder()
                    .aiResult(aiResult)
                    .storedFiles(storedFiles)
                    .build();

        } catch (IOException e) {
            log.error("이미지 처리 중 오류", e);
            throw new RuntimeException("이미지 처리 중 오류가 발생했습니다.");
        }
    }

    public List<CheckMetadataResponse> checkMetadata(List<MultipartFile> images) {
        return images.stream().map(file -> {
            ExifMeta exif = extractExif(file, file.getOriginalFilename());
            return CheckMetadataResponse.builder()
                    .originalName(file.getOriginalFilename())
                    .hasDate(exif.takenAt() != null)
                    .hasGps(exif.lat() != null && exif.lng() != null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public UUID saveDiary(UUID userId, LocalDate targetDate, DailyLogResponse aiResult,
                          List<StoredFileInfo> storedFiles, List<String> petIds) {

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        LocalDate memoryDate = (targetDate != null) ? targetDate : resolveMemoryDate(storedFiles);

        Memory memory = Memory.builder()
                .user(member)
                .memoryDate(memoryDate)
                .summary(aiResult.getAiSummary())
                .aiTitle(aiResult.getAiTitle())
                .aiDiary(aiResult.getMoments().stream()
                        .map(MomentResponse::getAiContent)
                        .collect(Collectors.joining("\n\n")))
                .aiStatus("DONE")
                .build();
        memoryRepository.save(memory);

        List<AttachedFile> attachedFiles =
                attachedFileService.registerExisting(ParentDomainType.MEMORY, memory.getId(), storedFiles);

        Map<String, Integer> nameToIndex = new HashMap<>();
        for (int i = 0; i < storedFiles.size(); i++) {
            nameToIndex.put(storedFiles.get(i).getOriginalName(), i);
        }

        List<Photo> savedPhotos = new ArrayList<>();
        Photo representativePhoto = null;
        for (int i = 0; i < attachedFiles.size(); i++) {
            AttachedFile af = attachedFiles.get(i);
            StoredFileInfo info = storedFiles.get(i);

            Photo photo = Photo.builder()
                    .memory(memory)
                    .pathOrigin(af.getStoredPath())
                    .takenAt(info.getTakenAt())
                    .gpsLat(info.getLatitude())
                    .gpsLng(info.getLongitude())
                    .sortOrder(i)
                    .build();
            photoRepository.save(photo);
            savedPhotos.add(photo);

            if (aiResult.getRepresentativePhotoPath() != null
                    && aiResult.getRepresentativePhotoPath().equals(info.getOriginalName())) {
                representativePhoto = photo;
            }
        }

        List<MomentResponse> moments = aiResult.getMoments();
        for (int mi = 0; mi < moments.size(); mi++) {
            MomentResponse mr = moments.get(mi);

            String momentRepPath = null;
            if (mr.getRepresentativePhotoPath() != null) {
                Integer idx = nameToIndex.get(mr.getRepresentativePhotoPath());
                if (idx != null && idx < savedPhotos.size()) {
                    momentRepPath = savedPhotos.get(idx).getPathOrigin();
                }
            }

            String tagsJson = mr.getTags() != null
                    ? "[\"" + String.join("\",\"", mr.getTags()) + "\"]"
                    : "[]";

            MemoryMoment moment = MemoryMoment.builder()
                    .memory(memory)
                    .sortOrder(mi)
                    .category(mr.getCategory())
                    .aiTitle(mr.getAiTitle())
                    .aiContent(mr.getAiContent())
                    .locationName(mr.getLocationName())
                    .energyLevel(mr.getEnergyLevel())
                    .tags(tagsJson)
                    .representativePhotoPath(momentRepPath)
                    .build();
            memoryMomentRepository.save(moment);

            if (mr.getPhotoFileNames() != null) {
                for (String fname : mr.getPhotoFileNames()) {
                    Integer idx = nameToIndex.get(fname);
                    if (idx != null && idx < savedPhotos.size()) {
                        savedPhotos.get(idx).assignMoment(moment);
                    }
                }
            }
        }

        for (MomentResponse mr : moments) {
            if (mr.getPhotoDetails() == null) continue;
            for (PhotoDetailResponse detail : mr.getPhotoDetails()) {
                Integer idx = nameToIndex.get(detail.getFileName());
                if (idx == null || idx >= savedPhotos.size()) continue;
                Photo photo = savedPhotos.get(idx);
                photo.updateAiData(detail.getPhotoComment(), detail.getVibeScore(), detail.getIsBest());
                if (detail.getThemeTags() != null) {
                    for (String tag : detail.getThemeTags()) {
                        if (tag != null && !tag.isBlank()) {
                            photoThemeTagRepository.save(PhotoThemeTag.builder()
                                    .photo(photo)
                                    .tag(tag.trim())
                                    .build());
                        }
                    }
                }
            }
        }

        if (representativePhoto == null && !savedPhotos.isEmpty()) {
            representativePhoto = savedPhotos.get(0);
        }
        if (representativePhoto != null) {
            memory.setRepresentativePhoto(representativePhoto);
        }

        for (String petId : petIds) {
            Pet pet = petRepository.findById(UUID.fromString(petId))
                    .orElseThrow(() -> new IllegalArgumentException("반려동물을 찾을 수 없습니다."));
            memoryDogRepository.save(MemoryDog.builder()
                    .memory(memory)
                    .dog(pet)
                    .role("MAIN")
                    .build());
        }

        return memory.getId();
    }

    private ExifMeta extractExif(MultipartFile file, String displayName) {
        LocalDateTime takenAt = null;
        Double lat = null, lng = null;

        try {
            Metadata metadata = ImageMetadataReader.readMetadata(file.getInputStream());

            ExifSubIFDDirectory exifSubDir = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (exifSubDir != null) {
                String dateStr = exifSubDir.getString(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL);
                if (dateStr == null) dateStr = exifSubDir.getString(ExifSubIFDDirectory.TAG_DATETIME_DIGITIZED);
                if (dateStr != null) {
                    try {
                        takenAt = LocalDateTime.parse(dateStr,
                                java.time.format.DateTimeFormatter.ofPattern("yyyy:MM:dd HH:mm:ss"));
                    } catch (Exception e) {
                        log.warn("EXIF 날짜 파싱 실패: {}", dateStr);
                    }
                }
            }

            GpsDirectory gpsDir = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gpsDir != null) {
                if (gpsDir.getGeoLocation() != null) {
                    lat = gpsDir.getGeoLocation().getLatitude();
                    lng = gpsDir.getGeoLocation().getLongitude();
                }
                if (takenAt == null) {
                    Date gpsDate = gpsDir.getGpsDate();
                    if (gpsDate != null) {
                        takenAt = LocalDateTime.ofInstant(gpsDate.toInstant(), ZoneId.systemDefault());
                    }
                }
            }

            if (takenAt == null) {
                com.drew.metadata.exif.ExifIFD0Directory exif0Dir =
                        metadata.getFirstDirectoryOfType(com.drew.metadata.exif.ExifIFD0Directory.class);
                if (exif0Dir != null) {
                    String dateStr = exif0Dir.getString(com.drew.metadata.exif.ExifIFD0Directory.TAG_DATETIME);
                    if (dateStr != null) {
                        try {
                            takenAt = LocalDateTime.parse(dateStr,
                                    java.time.format.DateTimeFormatter.ofPattern("yyyy:MM:dd HH:mm:ss"));
                        } catch (Exception ignored) {}
                    }
                }
            }
        } catch (Exception e) {
            log.warn("메타데이터 분석 예외 ({}): {}", displayName, e.getMessage());
        }

        if (takenAt == null && displayName != null && displayName.contains("KakaoTalk_")) {
            try {
                String[] parts = displayName.split("_");
                if (parts.length >= 3) {
                    takenAt = LocalDateTime.parse(parts[1] + parts[2].substring(0, 6),
                            java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                }
            } catch (Exception ignored) {}
        }

        return new ExifMeta(takenAt, lat, lng);
    }

    private LocalDate resolveMemoryDate(List<StoredFileInfo> storedFiles) {
        return storedFiles.stream()
                .map(StoredFileInfo::getTakenAt)
                .filter(Objects::nonNull)
                .map(LocalDateTime::toLocalDate)
                .findFirst()
                .orElse(LocalDate.now());
    }

    private String preparePetContext(List<PetInfoRequest> petInfos) {
        StringBuilder sb = new StringBuilder();
        for (PetInfoRequest info : petInfos) {
            petRepository.findById(UUID.fromString(info.getId())).ifPresent(pet ->
                    sb.append(String.format("- ID: %s, 이름: %s, 성격: %s, 말투: %s\n",
                            pet.getId(), pet.getName(), pet.getPersonality(), pet.getDiaryTone())));
        }
        return sb.toString();
    }

    private String buildPrompt(String petContext, String metadataContext, List<String> userTags, String userAiContext) {
        String contextSection = (userAiContext != null && !userAiContext.isBlank())
                ? "【보호자 개인 컨텍스트 — 일기 작성 시 항상 반영할 것】\n" + userAiContext + "\n\n"
                : "";
        return contextSection + String.format(
                "오늘의 사진들을 분석해서 반려동물 일기를 써줘.\n\n"
                        + "【핵심 규칙 — 반드시 지켜야 함】\n"
                        + "1. 사진 1장 = 모멘트 1개가 되어서는 절대 안 된다.\n"
                        + "2. 장소가 같거나 연속된 시간대·같은 활동의 사진들은 반드시 하나의 모멘트로 묶어라.\n"
                        + "   예) 공원 사진 3장 → 모멘트 1개 / 카페 사진 1장 → 모멘트 1개 / 집 사진 1장 → 모멘트 1개 = 총 3개\n"
                        + "3. 모든 사진은 반드시 어느 한 모멘트의 photoFileNames 와 photoDetails 양쪽에 모두 배정되어야 한다.\n"
                        + "4. 메타데이터의 촬영 시간을 최우선으로 참고하여 시간 순서를 판단해라.\n\n"
                        + "【photoDetails 작성 규칙】\n"
                        + "- themeTags: 아래 카테고리별로 최대 1개씩, 총 3개 이내. 반드시 겹침 없이 선택.\n"
                        + "  • 장소: 카페, 공원, 집, 산, 해변, 동물병원 등 구체적 장소 (있을 경우 1개)\n"
                        + "  • 활동: 산책, 휴식, 낮잠, 식사, 목욕, 놀이, 외출 등 (1개)\n"
                        + "  • 분위기·계절: 봄, 여름, 가을, 겨울, 밤, 비, 눈 등 (있을 경우 1개)\n"
                        + "  ※ 구체적 장소가 있으면 야외/실내 같은 추상 태그는 제외\n"
                        + "  ※ 인물(언니, 아빠 등 사람 이름·호칭)은 themeTags에 포함하지 않음\n"
                        + "  예) 카페 사진 → [\"카페\", \"휴식\"] / 서울숲 사진 → [\"서울숲\", \"산책\", \"봄\"]\n"
                        + "- photoComment: 이 사진 한 장을 보고 느낀 점을 반려동물 시점 한 줄 (20자 이내)\n"
                        + "- vibeScore: 1~100점. 사진의 선명도·구도·표정·감성을 종합 평가. 반드시 아래 기준을 엄격히 따를 것:\n"
                        + "  • 90~100: 전문 사진가 수준. 구도·빛·피사체 모두 완벽. 극히 드물어야 함\n"
                        + "  • 75~89: 잘 찍힌 사진. 명확한 주제, 좋은 빛, 자연스러운 표정\n"
                        + "  • 55~74: 평범한 일상 사진. 흔들림·구도 문제 없으나 특별하지 않음 (대부분 여기 해당)\n"
                        + "  • 35~54: 흔들리거나 구도가 어색하거나 피사체가 불분명한 사진\n"
                        + "  • 1~34: 심하게 흔들리거나 노출 과다·부족, 피사체가 거의 안 보이는 사진\n"
                        + "  ※ 평균 점수가 55~70점대가 되도록 분포를 맞출 것. 90점 이상은 진짜 탁월한 사진에만 부여\n"
                        + "- isBest: 이 모멘트 내에서 가장 잘 나온 사진 1장만 true, 나머지는 false\n\n"
                        + "반려동물 정보:\n%s\n"
                        + "사진 메타데이터 (파일명 정확히 사용할 것):\n%s\n"
                        + "사용자 키워드: %s\n\n"
                        + "반드시 아래 JSON 구조로만 응답해줘 (다른 텍스트 금지):\n"
                        + "{\n"
                        + "  \"aiTitle\": \"오늘의 전체 제목\",\n"
                        + "  \"aiSummary\": \"오늘의 전체 요약 (2~3문장)\",\n"
                        + "  \"representativePhotoPath\": \"하루를 대표하는 사진 파일명 (메타데이터 파일명 중 정확히 1개)\",\n"
                        + "  \"moments\": [\n"
                        + "    {\n"
                        + "      \"photoFileNames\": [\"이 모멘트에 속하는 사진 파일명1\", \"파일명2\"],\n"
                        + "      \"representativePhotoPath\": \"이 모멘트를 가장 잘 나타내는 사진 파일명 (photoFileNames 중 1개)\",\n"
                        + "      \"category\": \"ACTIVITY | OBJECT | HEALTH | GENERAL 중 하나\",\n"
                        + "      \"aiTitle\": \"모멘트 제목\",\n"
                        + "      \"aiContent\": \"모멘트 내용 (반려동물 1인칭 말투로 2~4문장)\",\n"
                        + "      \"energyLevel\": 3,\n"
                        + "      \"locationName\": \"장소 명칭\",\n"
                        + "      \"tags\": [\"모멘트 전체 태그1\", \"태그2\"],\n"
                        + "      \"targetPetIds\": [\"반려동물 ID\"],\n"
                        + "      \"photoDetails\": [\n"
                        + "        {\n"
                        + "          \"fileName\": \"photo_01.jpg\",\n"
                        + "          \"themeTags\": [\"봄\", \"꽃\", \"공원\"],\n"
                        + "          \"photoComment\": \"분홍 꽃잎 사이로 내 코가 보인다냥\",\n"
                        + "          \"vibeScore\": 68,\n"
                        + "          \"isBest\": true\n"
                        + "        }\n"
                        + "      ]\n"
                        + "    }\n"
                        + "  ]\n"
                        + "}\n"
                        + "주의: moments는 시간 순서 정렬 / photoFileNames와 photoDetails의 fileName은 메타데이터에 있는 파일명만 사용 / 각 모멘트 내 isBest는 반드시 1개만 true",
                petContext,
                metadataContext,
                String.join(", ", userTags != null ? userTags : List.of()));
    }

    private String resizeAndEncodeToBase64(InputStream inputStream) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Thumbnails.of(inputStream).size(512, 512).outputFormat("jpg").toOutputStream(outputStream);
        return Base64.getEncoder().encodeToString(outputStream.toByteArray());
    }

    private void checkRateLimit(UUID userId, LocalDate targetDate) {
        long dateCount = aiDiaryUsageRepository.countByMember_IdAndUsageTypeAndTargetDate(userId, "DIARY", targetDate);
        if (dateCount >= DATE_LIMIT) {
            throw AiRateLimitException.dateLimitExceeded(targetDate.toString());
        }

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        long dailyTotal = aiDiaryUsageRepository.countByMember_IdAndUsageTypeAndCalledAtBetween(userId, "DIARY", todayStart, todayEnd);
        if (dailyTotal >= DAILY_LIMIT) {
            throw AiRateLimitException.dailyLimitExceeded();
        }
    }

    private void recordUsage(UUID userId, LocalDate targetDate) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        aiDiaryUsageRepository.save(AiDiaryUsage.builder()
                .member(member)
                .targetDate(targetDate)
                .calledAt(LocalDateTime.now())
                .usageType("DIARY")
                .build());
    }

    public AiUsageResponse getUsage(UUID userId, LocalDate targetDate) {
        long dateCount = aiDiaryUsageRepository.countByMember_IdAndUsageTypeAndTargetDate(userId, "DIARY", targetDate);

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        long dailyTotal = aiDiaryUsageRepository.countByMember_IdAndUsageTypeAndCalledAtBetween(userId, "DIARY", todayStart, todayEnd);

        return AiUsageResponse.builder()
                .dateCount(dateCount)
                .dateLimit(DATE_LIMIT)
                .dailyTotal(dailyTotal)
                .dailyLimit(DAILY_LIMIT)
                .dateBlocked(dateCount >= DATE_LIMIT)
                .dailyBlocked(dailyTotal >= DAILY_LIMIT)
                .build();
    }

    private record ExifMeta(LocalDateTime takenAt, Double lat, Double lng) {}
}
