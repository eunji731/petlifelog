package com.petlifelog.backend.domain.ai;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.petlifelog.backend.common.ai.GeminiClient;
import com.petlifelog.backend.common.file.domain.AttachedFile;
import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.dto.StoredFileInfo;
import com.petlifelog.backend.common.file.service.AttachedFileService;
import com.petlifelog.backend.common.file.service.FileStorageService;
import com.petlifelog.backend.domain.ai.dto.*;
import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.MemberRepository;
import com.petlifelog.backend.domain.memory.*;
import com.petlifelog.backend.domain.pet.Pet;
import com.petlifelog.backend.domain.pet.PetRepository;
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

    private final GeminiClient geminiClient;
    private final PetRepository petRepository;
    private final MemberRepository memberRepository;
    private final MemoryRepository memoryRepository;
    private final PhotoRepository photoRepository;
    private final MemoryDogRepository memoryDogRepository;
    private final ObjectMapper objectMapper;
    private final FileStorageService fileStorageService;
    private final AttachedFileService attachedFileService;

    // ─────────────────────────────────────────────────────────────────
    // 1단계: 이미지 분석
    //  - 이미지를 FileStorageService 로 저장 (D:/uploads/files/memory/{sessionId}/...)
    //  - EXIF 메타데이터 추출
    //  - Gemini AI 분석
    //  - 결과(AnalyzeDiaryResult) 반환 → 프론트가 저장 시 storedFiles 를 그대로 전달
    // ─────────────────────────────────────────────────────────────────

    public AnalyzeDiaryResult analyzeDiary(List<MultipartFile> images,
                                           String petInfoJson,
                                           List<String> userTags) {
        try {
            List<PetInfoRequest> petInfos = objectMapper.readValue(
                    petInfoJson, new TypeReference<List<PetInfoRequest>>() {});

            // 이 분석 세션의 임시 ID (실제 Memory UUID는 save 시 결정됨)
            UUID sessionId = UUID.randomUUID();

            List<StoredFileInfo> storedFiles = new ArrayList<>();
            List<String> base64Images = new ArrayList<>();
            List<String> metadataLines = new ArrayList<>();

            for (MultipartFile file : images) {
                // 1) FileStorageService 로 저장 (기존: Files.copy to daily-path)
                String storedPath = fileStorageService.store(file, ParentDomainType.MEMORY, sessionId);

                // 2) EXIF 메타데이터 추출
                ExifMeta exif = extractExif(file, file.getOriginalFilename());

                storedFiles.add(StoredFileInfo.builder()
                        .originalName(file.getOriginalFilename())
                        .storedPath(storedPath)
                        .contentType(file.getContentType())
                        .fileSize(file.getSize())
                        .takenAt(exif.takenAt)
                        .latitude(exif.lat)
                        .longitude(exif.lng)
                        .build());

                // 3) AI 프롬프트용: original 파일명으로 구분 (AI 응답의 representativePhotoPath 기준)
                metadataLines.add(String.format("- 파일명: %s, 촬영시간: %s, 위치: %s",
                        file.getOriginalFilename(),
                        exif.takenAt != null ? exif.takenAt : "알수없음",
                        exif.lat != null ? exif.lat + ", " + exif.lng : "알수없음"));

                // 4) Gemini 분석용 base64 (저장된 파일에서 읽어 리사이즈)
                File physicalFile = fileStorageService.getFilesRoot()
                        .resolve(storedPath).toFile();
                base64Images.add(resizeAndEncodeToBase64(physicalFile));
            }

            String petContext = preparePetContext(petInfos);
            String metadataContext = String.join("\n", metadataLines);
            log.info("AI에 전달되는 메타데이터:\n{}", metadataContext);

            String prompt = buildPrompt(petContext, metadataContext, userTags);
            DailyLogResponse aiResult = geminiClient.analyzeImages(base64Images, prompt);

            return AnalyzeDiaryResult.builder()
                    .aiResult(aiResult)
                    .storedFiles(storedFiles)
                    .build();

        } catch (IOException e) {
            log.error("이미지 처리 중 오류", e);
            throw new RuntimeException("이미지 처리 중 오류가 발생했습니다.");
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // 2단계: 일기 저장
    //  - Memory 엔티티 생성
    //  - AttachedFile 레코드 등록 (이미 디스크에 있는 파일을 DB에 연결)
    //  - Photo 레코드 등록 (EXIF 메타데이터 보존용)
    //  - MemoryDog 매핑
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    public UUID saveDiary(UUID userId, DailyLogResponse aiResult,
                          List<StoredFileInfo> storedFiles, List<String> petIds) {

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 1. Memory 생성
        Memory memory = Memory.builder()
                .user(member)
                .memoryDate(resolveMemoryDate(storedFiles))
                .summary(aiResult.getAiSummary())
                .aiTitle(aiResult.getAiTitle())
                .aiDiary(aiResult.getMoments().stream()
                        .map(MomentResponse::getAiContent)
                        .collect(Collectors.joining("\n\n")))
                .aiStatus("DONE")
                .build();
        memoryRepository.save(memory);

        // 2. AttachedFile 등록 (파일 시스템 - 통합 관리)
        List<AttachedFile> attachedFiles =
                attachedFileService.registerExisting(ParentDomainType.MEMORY, memory.getId(), storedFiles);

        // 3. Photo 등록 (EXIF 메타데이터 보존)
        Photo representativePhoto = null;
        for (int i = 0; i < attachedFiles.size(); i++) {
            AttachedFile af = attachedFiles.get(i);
            StoredFileInfo info = storedFiles.get(i);

            Photo photo = Photo.builder()
                    .memory(memory)
                    .pathOrigin("/files/" + af.getStoredPath())   // 프론트 접근 URL
                    .takenAt(info.getTakenAt())
                    .gpsLat(info.getLatitude())
                    .gpsLng(info.getLongitude())
                    .sortOrder(i)
                    .build();
            photoRepository.save(photo);

            // AI 가 지정한 대표 사진 매칭 (original 파일명으로 비교)
            if (aiResult.getRepresentativePhotoPath() != null
                    && aiResult.getRepresentativePhotoPath().equals(info.getOriginalName())) {
                representativePhoto = photo;
            }
        }

        // 첫 번째 사진을 fallback 대표 사진으로
        if (representativePhoto == null && !attachedFiles.isEmpty()) {
            representativePhoto = photoRepository.findByMemoryAndSortOrder(memory, 0).orElse(null);
        }
        if (representativePhoto != null) {
            memory.setRepresentativePhoto(representativePhoto);
        }

        // 4. MemoryDog 매핑
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

    // ─────────────────────────────────────────────────────────────────

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

        // 파일명 기반 fallback (카카오톡 형식)
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

    private String buildPrompt(String petContext, String metadataContext, List<String> userTags) {
        return String.format(
                "오늘의 사진들을 분석해서 반려동물 일기를 써줘.\n\n"
                        + "【핵심 규칙 — 반드시 지켜야 함】\n"
                        + "1. 사진 1장 = 모멘트 1개가 되어서는 절대 안 된다.\n"
                        + "2. 장소가 같거나 연속된 시간대·같은 활동의 사진들은 반드시 하나의 모멘트로 묶어라.\n"
                        + "   예) 공원 사진 3장 → 모멘트 1개 / 카페 사진 1장 → 모멘트 1개 / 집 사진 1장 → 모멘트 1개 = 총 3개\n"
                        + "3. 모든 사진은 반드시 어느 한 모멘트의 photoFileNames 에 배정되어야 한다.\n"
                        + "4. 메타데이터의 촬영 시간을 최우선으로 참고하여 시간 순서를 판단해라.\n\n"
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
                        + "      \"tags\": [\"태그1\", \"태그2\"],\n"
                        + "      \"targetPetIds\": [\"반려동물 ID\"]\n"
                        + "    }\n"
                        + "  ]\n"
                        + "}\n"
                        + "주의: moments는 시간 순서 정렬 / photoFileNames 는 메타데이터에 있는 파일명만 사용",
                petContext,
                metadataContext,
                String.join(", ", userTags != null ? userTags : List.of()));
    }

    private String resizeAndEncodeToBase64(File file) throws IOException {
        BufferedImage originalImage = ImageIO.read(file);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Thumbnails.of(originalImage).size(512, 512).outputFormat("jpg").toOutputStream(outputStream);
        return Base64.getEncoder().encodeToString(outputStream.toByteArray());
    }

    /** EXIF 파싱 결과를 담는 내부 레코드 */
    private record ExifMeta(LocalDateTime takenAt, Double lat, Double lng) {}
}
