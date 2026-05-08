package com.petlifelog.backend.domain.inventory.dto;

import lombok.Data;

import java.util.List;

@Data
public class InventoryItemRequest {
    private String name;
    private String category;
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
    private List<String> deletedFileIds;
}
