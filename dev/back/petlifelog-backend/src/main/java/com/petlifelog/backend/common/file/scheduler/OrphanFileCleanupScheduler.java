package com.petlifelog.backend.common.file.scheduler;

import com.petlifelog.backend.common.file.service.AttachedFileService;
import com.petlifelog.backend.common.file.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * DB에 기록이 없는 고아 물리 파일을 주기적으로 정리한다.
 *
 * 발생 원인:
 *  - 파일 저장 후 DB 저장 실패 (트랜잭션 롤백 시 물리 파일은 그대로 남음)
 *  - 예외적인 서버 다운 등 비정상 종료
 *
 * 주의: 대용량 파일 디렉터리에서 Files.walk() 는 부하가 클 수 있다.
 *       실제 운영에서는 실행 시간대(새벽 트래픽 최저 시점)를 고려할 것.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrphanFileCleanupScheduler {

    private final AttachedFileService attachedFileService;
    private final FileStorageService fileStorageService;

    @Scheduled(cron = "0 0 3 * * *") // 매일 새벽 3시
    public void cleanOrphanFiles() {
        log.info("[OrphanCleanup] 고아 파일 정리 시작");

        Set<String> activePaths = attachedFileService.getAllStoredPaths();
        fileStorageService.deleteOrphans(activePaths);

        log.info("[OrphanCleanup] 고아 파일 정리 완료");
    }
}
