package com.petlifelog.backend.domain.memory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MemoryRepository extends JpaRepository<Memory, UUID> {

    List<Memory> findByUser_IdOrderByMemoryDateDesc(UUID userId);
}
