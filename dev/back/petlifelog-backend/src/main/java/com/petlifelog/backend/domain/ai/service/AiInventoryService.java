package com.petlifelog.backend.domain.ai.service;

import com.petlifelog.backend.common.ai.GeminiClient;
import com.petlifelog.backend.common.exception.AiRateLimitException;
import com.petlifelog.backend.domain.ai.domain.AiDiaryUsage;
import com.petlifelog.backend.domain.ai.dto.AnalyzeProductResult;
import com.petlifelog.backend.domain.ai.repository.AiDiaryUsageRepository;
import com.petlifelog.backend.domain.member.domain.Member;
import com.petlifelog.backend.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class AiInventoryService {

    private static final int DAILY_LIMIT = 10;

    private final GeminiClient geminiClient;
    private final AiDiaryUsageRepository aiDiaryUsageRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public AnalyzeProductResult analyzeProduct(UUID userId, List<MultipartFile> images) {
        checkDailyLimit(userId);

        try {
            List<String> base64Images = new ArrayList<>();
            for (MultipartFile file : images) {
                base64Images.add(resizeAndEncodeToBase64(file));
            }
            String ocrText = geminiClient.ocrProductImages(base64Images);
            AnalyzeProductResult result = geminiClient.extractProductInfoFromText(ocrText);

            recordUsage(userId);

            return result;
        } catch (IOException e) {
            log.error("이미지 처리 중 오류", e);
            throw new RuntimeException("이미지 처리 중 오류가 발생했습니다.");
        }
    }

    private void checkDailyLimit(UUID userId) {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        long dailyTotal = aiDiaryUsageRepository.countByMember_IdAndUsageTypeAndCalledAtBetween(userId, "INVENTORY", todayStart, todayEnd);
        if (dailyTotal >= DAILY_LIMIT) {
            throw AiRateLimitException.dailyLimitExceeded();
        }
    }

    private void recordUsage(UUID userId) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        aiDiaryUsageRepository.save(AiDiaryUsage.builder()
                .member(member)
                .targetDate(LocalDate.now())
                .calledAt(LocalDateTime.now())
                .usageType("INVENTORY")
                .build());
    }

    private String resizeAndEncodeToBase64(MultipartFile file) throws IOException {
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Thumbnails.of(originalImage)
                .size(1024, 1024)
                .keepAspectRatio(true)
                .outputFormat("jpg")
                .toOutputStream(outputStream);
        return Base64.getEncoder().encodeToString(outputStream.toByteArray());
    }
}
