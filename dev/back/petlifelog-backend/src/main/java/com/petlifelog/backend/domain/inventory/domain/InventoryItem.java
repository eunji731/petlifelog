package com.petlifelog.backend.domain.inventory.domain;

import com.petlifelog.backend.common.domain.BaseTimeEntity;
import com.petlifelog.backend.domain.member.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "inventory_items")
public class InventoryItem extends BaseTimeEntity {

    @Id
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemCategory category;

    @Column(name = "photo_path")
    private String photoPath;

    private String brand;

    @Column(name = "production_date")
    private LocalDate productionDate;

    @Column(name = "expiry_date_text")
    private String expiryDateText;

    @Column(name = "expiry_date_specific")
    private LocalDate expiryDateSpecific;

    @Column(name = "opened_at")
    private LocalDate openedAt;

    @Column(name = "ingredients_json", columnDefinition = "TEXT")
    private String ingredientsJson;

    private String flavor;

    private String material;

    private String size;

    @Enumerated(EnumType.STRING)
    @Column(name = "storage_method")
    private StorageMethod storageMethod;

    @Column(name = "suggested_usage", columnDefinition = "TEXT")
    private String suggestedUsage;

    private Integer rating;

    @Column(nullable = false)
    private Integer stock;

    private Integer price;

    @Column(name = "is_feeding", nullable = false)
    private Boolean isFeeding = false;

    @Column(name = "added_at", nullable = false)
    private LocalDate addedAt;

    @Builder
    public InventoryItem(Member user, String name, ItemCategory category, String photoPath,
                         String brand, String flavor, LocalDate productionDate, String expiryDateText,
                         LocalDate expiryDateSpecific, LocalDate openedAt, String ingredientsJson,
                         String material, String size, StorageMethod storageMethod,
                         String suggestedUsage, Integer rating, Integer stock, Integer price,
                         Boolean isFeeding) {
        this.user = user;
        this.name = name;
        this.category = category;
        this.photoPath = photoPath;
        this.brand = brand;
        this.flavor = flavor;
        this.productionDate = productionDate;
        this.expiryDateText = expiryDateText;
        this.expiryDateSpecific = expiryDateSpecific;
        this.openedAt = openedAt;
        this.ingredientsJson = ingredientsJson;
        this.material = material;
        this.size = size;
        this.storageMethod = storageMethod;
        this.suggestedUsage = suggestedUsage;
        this.rating = rating != null ? rating : 5;
        this.stock = stock != null ? stock : 1;
        this.price = price;
        this.isFeeding = isFeeding != null ? isFeeding : false;
        this.addedAt = LocalDate.now();
    }

    public void toggleFeeding() {
        this.isFeeding = !this.isFeeding;
    }

    public void updatePhotoPath(String photoPath) {
        this.photoPath = photoPath;
    }

    public void update(String name, ItemCategory category, String brand, String flavor,
                       LocalDate productionDate, String expiryDateText, LocalDate expiryDateSpecific,
                       LocalDate openedAt, String ingredientsJson, String material, String size,
                       StorageMethod storageMethod, String suggestedUsage,
                       Integer rating, Integer stock, Integer price, Boolean isFeeding) {
        this.name = name;
        this.category = category;
        this.brand = brand;
        this.flavor = flavor;
        this.productionDate = productionDate;
        this.expiryDateText = expiryDateText;
        this.expiryDateSpecific = expiryDateSpecific;
        this.openedAt = openedAt;
        this.ingredientsJson = ingredientsJson;
        this.material = material;
        this.size = size;
        this.storageMethod = storageMethod;
        this.suggestedUsage = suggestedUsage;
        if (rating != null) this.rating = rating;
        if (stock != null) this.stock = stock;
        this.price = price;
        if (isFeeding != null) this.isFeeding = isFeeding;
    }
}
