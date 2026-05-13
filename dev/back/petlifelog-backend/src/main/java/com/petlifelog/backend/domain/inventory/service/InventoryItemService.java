package com.petlifelog.backend.domain.inventory.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.dto.FileResponse;
import com.petlifelog.backend.common.file.service.AttachedFileService;
import com.petlifelog.backend.domain.inventory.domain.InventoryItem;
import com.petlifelog.backend.domain.inventory.domain.ItemCategory;
import com.petlifelog.backend.domain.inventory.domain.StorageMethod;
import com.petlifelog.backend.domain.inventory.dto.InventoryItemRequest;
import com.petlifelog.backend.domain.inventory.dto.InventoryItemResponse;
import com.petlifelog.backend.domain.inventory.repository.InventoryItemRepository;
import com.petlifelog.backend.domain.member.domain.Member;
import com.petlifelog.backend.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class InventoryItemService {

    private final InventoryItemRepository inventoryItemRepository;
    private final MemberRepository memberRepository;
    private final AttachedFileService attachedFileService;
    private final ObjectMapper objectMapper;

    @Transactional
    public InventoryItemResponse createItem(UUID userId, List<MultipartFile> images, InventoryItemRequest request) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        InventoryItem item = InventoryItem.builder()
                .user(member)
                .name(request.getName())
                .category(parseCategory(request.getCategory()))
                .brand(request.getBrand())
                .flavor(request.getFlavor())
                .productionDate(parseDate(request.getProductionDate()))
                .expiryDateText(request.getExpiryDateText())
                .expiryDateSpecific(parseDate(request.getExpiryDateSpecific()))
                .openedAt(parseDate(request.getOpenedAt()))
                .ingredientsJson(toJson(request.getIngredients()))
                .material(request.getMaterial())
                .size(request.getSize())
                .storageMethod(parseStorageMethod(request.getStorageMethod()))
                .suggestedUsage(request.getSuggestedUsage())
                .rating(request.getRating())
                .stock(request.getStock())
                .price(request.getPrice())
                .isFeeding(request.getIsFeeding())
                .build();

        inventoryItemRepository.save(item);

        List<FileResponse> files = attachedFileService.saveAll(ParentDomainType.INVENTORY, item.getId(), images);
        if (!files.isEmpty()) {
            item.updatePhotoPath(files.get(0).getFileUrl());
        }

        return InventoryItemResponse.from(item, files);
    }

    public List<InventoryItemResponse> getItems(UUID userId) {
        return inventoryItemRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(item -> InventoryItemResponse.from(item,
                        attachedFileService.getFiles(ParentDomainType.INVENTORY, item.getId())))
                .toList();
    }

    @Transactional
    public void deleteItem(UUID userId, UUID itemId) {
        InventoryItem item = inventoryItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));

        attachedFileService.deleteAllByParent(ParentDomainType.INVENTORY, itemId);
        inventoryItemRepository.delete(item);
    }

    public InventoryItemResponse getItem(UUID userId, UUID itemId) {
        InventoryItem item = inventoryItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));
        List<FileResponse> files = attachedFileService.getFiles(ParentDomainType.INVENTORY, itemId);
        return InventoryItemResponse.from(item, files);
    }

    @Transactional
    public InventoryItemResponse updateItem(UUID userId, UUID itemId, List<MultipartFile> images, InventoryItemRequest request) {
        InventoryItem item = inventoryItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));

        item.update(
                request.getName(),
                parseCategory(request.getCategory()),
                request.getBrand(),
                request.getFlavor(),
                parseDate(request.getProductionDate()),
                request.getExpiryDateText(),
                parseDate(request.getExpiryDateSpecific()),
                parseDate(request.getOpenedAt()),
                toJson(request.getIngredients()),
                request.getMaterial(),
                request.getSize(),
                parseStorageMethod(request.getStorageMethod()),
                request.getSuggestedUsage(),
                request.getRating(),
                request.getStock(),
                request.getPrice(),
                request.getIsFeeding()
        );

        List<UUID> deletedUuids = request.getDeletedFileIds() == null ? List.of() :
                request.getDeletedFileIds().stream().map(UUID::fromString).toList();
        List<FileResponse> files = attachedFileService.syncFiles(
                ParentDomainType.INVENTORY, itemId, deletedUuids, images);

        if (!files.isEmpty()) {
            item.updatePhotoPath(files.get(0).getFileUrl());
        } else {
            item.updatePhotoPath(null);
        }

        return InventoryItemResponse.from(item, files);
    }

    @Transactional
    public InventoryItemResponse toggleFeeding(UUID userId, UUID itemId) {
        InventoryItem item = inventoryItemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));

        item.toggleFeeding();
        List<FileResponse> files = attachedFileService.getFiles(ParentDomainType.INVENTORY, itemId);
        return InventoryItemResponse.from(item, files);
    }

    private ItemCategory parseCategory(String value) {
        if (value == null) return ItemCategory.ETC;
        try {
            return ItemCategory.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ItemCategory.ETC;
        }
    }

    private StorageMethod parseStorageMethod(String value) {
        if (value == null) return StorageMethod.ROOM_TEMP;
        try {
            return StorageMethod.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return StorageMethod.ROOM_TEMP;
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank() || value.equals("null")) return null;
        try {
            return LocalDate.parse(value);
        } catch (Exception e) {
            return null;
        }
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return null;
        }
    }
}
