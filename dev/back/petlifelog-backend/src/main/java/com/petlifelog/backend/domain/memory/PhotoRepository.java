package com.petlifelog.backend.domain.memory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {

    Optional<Photo> findByMemoryAndSortOrder(Memory memory, int sortOrder);

    @Query("""
            SELECT p FROM Photo p
            JOIN FETCH p.memory m
            WHERE p.gpsLat IS NOT NULL
              AND p.gpsLng IS NOT NULL
              AND m.user.id = :userId
              AND (:minLat IS NULL OR p.gpsLat >= :minLat)
              AND (:maxLat IS NULL OR p.gpsLat <= :maxLat)
              AND (:minLng IS NULL OR p.gpsLng >= :minLng)
              AND (:maxLng IS NULL OR p.gpsLng <= :maxLng)
              AND (:startDate IS NULL OR m.memoryDate >= :startDate)
              AND (:endDate IS NULL OR m.memoryDate <= :endDate)
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md
                    WHERE md.memory = m AND md.dog.id = :petId
              ))
            ORDER BY m.memoryDate DESC, p.sortOrder ASC
            """)
    List<Photo> findMapMemories(
            @Param("userId") UUID userId,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng,
            @Param("petId") UUID petId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
