package com.petlifelog.backend.domain.memory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface MemoryRepository extends JpaRepository<Memory, UUID> {

    List<Memory> findByUser_IdOrderByMemoryDateDesc(UUID userId);

    List<Memory> findByUser_IdAndMemoryDateBetweenOrderByMemoryDateDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);
}
