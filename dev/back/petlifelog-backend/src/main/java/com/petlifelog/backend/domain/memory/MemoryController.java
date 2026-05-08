package com.petlifelog.backend.domain.memory;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.memory.dto.MemoryListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/memories")
public class MemoryController {

    private final MemoryService memoryService;

    @GetMapping
    public ApiResponse<List<MemoryListResponse>> getMemories(
            @AuthenticationPrincipal User user) {

        return ApiResponse.success(memoryService.getMemories(UUID.fromString(user.getUsername())));
    }

    @DeleteMapping("/{memoryId}")
    public ApiResponse<Void> deleteMemory(
            @AuthenticationPrincipal User user,
            @PathVariable UUID memoryId) {

        memoryService.deleteMemory(UUID.fromString(user.getUsername()), memoryId);
        return ApiResponse.success();
    }
}
