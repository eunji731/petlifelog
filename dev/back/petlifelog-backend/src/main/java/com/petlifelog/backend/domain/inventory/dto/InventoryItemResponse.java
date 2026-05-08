package com.petlifelog.backend.domain.inventory.dto;

import com.petlifelog.backend.common.file.dto.FileResponse;
import com.petlifelog.backend.domain.inventory.InventoryItem;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class InventoryItemResponse {
    private String id;
    private String name;
    private String category;
    private String photo;
    private List<PhotoInfo> photos;
    private String brand;
    private String flavor;
    private String productionDate;
    private String expiryDateText;
    private String expiryDateSpecific;
    private String openedAt;
    private List<String> ingredients;
    private String material;
    private String size;
    private String storageMethod;
    private String suggestedUsage;
    private Integer rating;
    private Integer stock;
    private Integer price;
    private Boolean isFeeding;
    private String addedAt;

    @Data
    @Builder
    public static class PhotoInfo {
        private String id;
        private String url;

        public static PhotoInfo from(FileResponse f) {
            return PhotoInfo.builder()
                    .id(f.getId().toString())
                    .url(f.getFileUrl())
                    .build();
        }
    }

    public static InventoryItemResponse from(InventoryItem item, List<FileResponse> files) {
        List<PhotoInfo> photoInfos = files.stream().map(PhotoInfo::from).toList();
        String firstPhoto = photoInfos.isEmpty() ? item.getPhotoPath() : photoInfos.get(0).getUrl();
        return InventoryItemResponse.builder()
                .id(item.getId().toString())
                .name(item.getName())
                .category(item.getCategory().name())
                .photo(firstPhoto)
                .photos(photoInfos)
                .brand(item.getBrand())
                .flavor(item.getFlavor())
                .productionDate(item.getProductionDate() != null ? item.getProductionDate().toString() : null)
                .expiryDateText(item.getExpiryDateText())
                .expiryDateSpecific(item.getExpiryDateSpecific() != null ? item.getExpiryDateSpecific().toString() : null)
                .openedAt(item.getOpenedAt() != null ? item.getOpenedAt().toString() : null)
                .ingredients(parseIngredients(item.getIngredientsJson()))
                .material(item.getMaterial())
                .size(item.getSize())
                .storageMethod(item.getStorageMethod() != null ? item.getStorageMethod().name() : null)
                .suggestedUsage(item.getSuggestedUsage())
                .rating(item.getRating())
                .stock(item.getStock())
                .price(item.getPrice())
                .isFeeding(item.getIsFeeding())
                .addedAt(item.getAddedAt().toString())
                .build();
    }

    private static List<String> parseIngredients(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            json = json.trim();
            if (!json.startsWith("[")) return List.of();
            json = json.substring(1, json.length() - 1);
            if (json.isBlank()) return List.of();
            String[] parts = json.split(",");
            return java.util.Arrays.stream(parts)
                    .map(s -> s.trim().replaceAll("^\"|\"$", ""))
                    .filter(s -> !s.isBlank())
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }
}
