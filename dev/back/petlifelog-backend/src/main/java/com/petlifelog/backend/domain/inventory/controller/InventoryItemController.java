package com.petlifelog.backend.domain.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.petlifelog.backend.common.dto.ApiResponse;
import com.petlifelog.backend.domain.inventory.dto.InventoryItemRequest;
import com.petlifelog.backend.domain.inventory.dto.InventoryItemResponse;
import com.petlifelog.backend.domain.inventory.service.InventoryItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/inventory")
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;
    private final ObjectMapper objectMapper;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<InventoryItemResponse> createItem(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam("data") String dataJson) throws Exception {

        InventoryItemRequest request = objectMapper.readValue(dataJson, InventoryItemRequest.class);
        InventoryItemResponse response = inventoryItemService.createItem(
                UUID.fromString(user.getUsername()), images, request);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<List<InventoryItemResponse>> getItems(
            @AuthenticationPrincipal User user) {

        List<InventoryItemResponse> items = inventoryItemService.getItems(UUID.fromString(user.getUsername()));
        return ApiResponse.success(items);
    }

    @GetMapping("/{id}")
    public ApiResponse<InventoryItemResponse> getItem(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {

        InventoryItemResponse response = inventoryItemService.getItem(UUID.fromString(user.getUsername()), id);
        return ApiResponse.success(response);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<InventoryItemResponse> updateItem(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam("data") String dataJson) throws Exception {

        InventoryItemRequest request = objectMapper.readValue(dataJson, InventoryItemRequest.class);
        InventoryItemResponse response = inventoryItemService.updateItem(
                UUID.fromString(user.getUsername()), id, images, request);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteItem(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {

        inventoryItemService.deleteItem(UUID.fromString(user.getUsername()), id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/{id}/feeding")
    public ApiResponse<InventoryItemResponse> toggleFeeding(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {

        InventoryItemResponse response = inventoryItemService.toggleFeeding(
                UUID.fromString(user.getUsername()), id);
        return ApiResponse.success(response);
    }
}
