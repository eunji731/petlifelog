package com.petlifelog.backend.domain.memory.repository;

import com.petlifelog.backend.domain.memory.domain.Memory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface MemoryRepository extends JpaRepository<Memory, UUID> {

    List<Memory> findByUser_IdOrderByMemoryDateDesc(UUID userId);

    List<Memory> findByUser_IdAndMemoryDateBetweenOrderByMemoryDateDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);

    long countByUser_IdAndMemoryDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);

    @Query("""
            SELECT COUNT(m) FROM Memory m
            WHERE m.user.id = :userId
              AND m.memoryDate BETWEEN :start AND :end
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = m AND md.dog.id = :petId
              ))
            """)
    long countByUserAndDateRangeAndPet(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("petId") UUID petId);

    @Query("SELECT m.memoryDate FROM Memory m WHERE m.user.id = :userId ORDER BY m.memoryDate DESC")
    List<LocalDate> findAllMemoryDatesByUserIdOrderByDesc(@Param("userId") UUID userId);

    @Query("""
            SELECT DISTINCT m FROM Memory m
            LEFT JOIN FETCH m.moments
            WHERE m.user.id = :userId
              AND m.memoryDate BETWEEN :start AND :end
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = m AND md.dog.id = :petId
              ))
            ORDER BY m.memoryDate DESC
            """)
    List<Memory> findWithMomentsByUserAndDateRange(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("petId") UUID petId);
}
