package com.petlifelog.backend.domain.inventory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {

    List<InventoryItem> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<InventoryItem> findByIdAndUserId(UUID id, UUID userId);
}
