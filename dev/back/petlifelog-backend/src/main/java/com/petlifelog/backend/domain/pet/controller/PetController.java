package com.petlifelog.backend.domain.pet.controller;

import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.pet.service.PetService;
import com.petlifelog.backend.domain.pet.dto.PetRequest;
import com.petlifelog.backend.domain.pet.dto.PetResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/pets")
public class PetController {

    private final PetService petService;

    @GetMapping
    public ApiResponse<List<PetResponse>> getPets(@AuthenticationPrincipal User user) {
        return ApiResponse.success(petService.getPets(UUID.fromString(user.getUsername())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PetResponse>> addPet(
            @AuthenticationPrincipal User user,
            @RequestBody PetRequest request) {

        return ResponseEntity.ok(ApiResponse.success(
                petService.addPet(UUID.fromString(user.getUsername()), request)));
    }

    @PutMapping("/{petId}")
    public ResponseEntity<ApiResponse<PetResponse>> updatePet(
            @PathVariable UUID petId,
            @RequestBody PetRequest request) {

        return ResponseEntity.ok(ApiResponse.success(petService.updatePet(petId, request)));
    }

    @DeleteMapping("/{petId}")
    public ApiResponse<Void> deletePet(@PathVariable UUID petId) {
        petService.deletePet(petId);
        return ApiResponse.success();
    }
}
