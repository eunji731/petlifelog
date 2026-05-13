package com.petlifelog.backend.domain.memory.repository;

import com.petlifelog.backend.domain.memory.domain.Memory;
import com.petlifelog.backend.domain.memory.domain.Photo;
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

    Optional<Photo> findFirstByMemory_IdAndGpsLatIsNotNull(UUID memoryId);

    @Query("""
            SELECT p FROM Photo p
            JOIN FETCH p.memory m
            WHERE p.isBest = true
              AND m.user.id = :userId
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = m AND md.dog.id = :petId
              ))
            ORDER BY p.vibeScore DESC
            """)
    List<Photo> findBestPhotos(@Param("userId") UUID userId, @Param("petId") UUID petId);

    @Query("""
            SELECT COUNT(p) FROM Photo p
            WHERE p.isBest = true
              AND p.memory.user.id = :userId
              AND p.memory.memoryDate BETWEEN :start AND :end
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = p.memory AND md.dog.id = :petId
              ))
            """)
    long countBestPhotos(
            @Param("userId") UUID userId,
            @Param("petId") UUID petId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("""
            SELECT p FROM Photo p
            JOIN FETCH p.memory m
            WHERE p.gpsLat IS NOT NULL
              AND p.gpsLng IS NOT NULL
              AND m.user.id = :userId
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md
                    WHERE md.memory = m AND md.dog.id = :petId
              ))
              AND (
                    LOWER(m.location)  LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR LOWER(m.aiTitle)   LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR LOWER(m.aiDiary)   LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR LOWER(m.summary)   LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR LOWER(m.userMemo)  LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            ORDER BY m.memoryDate DESC, p.sortOrder ASC
            """)
    List<Photo> findMapMemoriesByKeyword(
            @Param("userId") UUID userId,
            @Param("keyword") String keyword,
            @Param("petId") UUID petId
    );

    @Query("""
            SELECT DISTINCT m.location FROM Memory m
            WHERE m.user.id = :userId
              AND m.location IS NOT NULL
              AND (:q IS NULL OR LOWER(m.location) LIKE LOWER(CONCAT('%', :q, '%')))
              AND EXISTS (SELECT p FROM Photo p WHERE p.memory = m AND p.gpsLat IS NOT NULL)
            """)
    List<String> findDistinctLocations(@Param("userId") UUID userId, @Param("q") String q);

    @Query("""
            SELECT DISTINCT m.aiTitle FROM Memory m
            WHERE m.user.id = :userId
              AND m.aiTitle IS NOT NULL
              AND (:q IS NULL OR LOWER(m.aiTitle) LIKE LOWER(CONCAT('%', :q, '%')))
              AND EXISTS (SELECT p FROM Photo p WHERE p.memory = m AND p.gpsLat IS NOT NULL)
            """)
    List<String> findDistinctAiTitles(@Param("userId") UUID userId, @Param("q") String q);

    @Query("""
            SELECT p FROM Photo p
            JOIN FETCH p.memory m
            WHERE p.gpsLat IS NOT NULL
              AND p.gpsLng IS NOT NULL
              AND m.user.id = :userId
              AND p.gpsLat BETWEEN :swLat AND :neLat
              AND p.gpsLng BETWEEN :swLng AND :neLng
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md
                    WHERE md.memory = m AND md.dog.id = :petId
              ))
            ORDER BY m.memoryDate DESC, p.sortOrder ASC
            """)
    List<Photo> findMapMarkers(
            @Param("userId") UUID userId,
            @Param("swLat") double swLat,
            @Param("neLat") double neLat,
            @Param("swLng") double swLng,
            @Param("neLng") double neLng,
            @Param("petId") UUID petId
    );
}
