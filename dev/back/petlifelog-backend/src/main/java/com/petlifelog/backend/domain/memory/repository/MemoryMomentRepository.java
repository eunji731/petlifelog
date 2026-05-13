package com.petlifelog.backend.domain.memory.repository;

import com.petlifelog.backend.domain.memory.domain.MemoryMoment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface MemoryMomentRepository extends JpaRepository<MemoryMoment, UUID> {

    @Query("""
            SELECT mm.locationName, COUNT(DISTINCT mm.memory.id)
            FROM MemoryMoment mm
            WHERE mm.memory.user.id = :userId
              AND mm.memory.memoryDate BETWEEN :start AND :end
              AND mm.locationName IS NOT NULL
              AND mm.locationName != ''
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = mm.memory AND md.dog.id = :petId
              ))
            GROUP BY mm.locationName
            ORDER BY COUNT(DISTINCT mm.memory.id) DESC
            """)
    List<Object[]> findFavoritePlaces(
            @Param("userId") UUID userId,
            @Param("petId") UUID petId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("""
            SELECT COUNT(DISTINCT mm.locationName)
            FROM MemoryMoment mm
            WHERE mm.memory.user.id = :userId
              AND mm.memory.memoryDate BETWEEN :start AND :end
              AND mm.locationName IS NOT NULL
              AND mm.locationName != ''
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = mm.memory AND md.dog.id = :petId
              ))
            """)
    long countDistinctVisitedPlaces(
            @Param("userId") UUID userId,
            @Param("petId") UUID petId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("""
            SELECT AVG(mm.energyLevel)
            FROM MemoryMoment mm
            WHERE mm.memory.user.id = :userId
              AND mm.memory.memoryDate BETWEEN :start AND :end
              AND mm.energyLevel IS NOT NULL
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = mm.memory AND md.dog.id = :petId
              ))
            """)
    Double findAvgEnergyLevel(
            @Param("userId") UUID userId,
            @Param("petId") UUID petId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("""
            SELECT DISTINCT mm.locationName
            FROM MemoryMoment mm
            WHERE mm.memory.user.id = :userId
              AND mm.memory.memoryDate BETWEEN :start AND :end
              AND mm.locationName IS NOT NULL
              AND mm.locationName != ''
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = mm.memory AND md.dog.id = :petId
              ))
            """)
    List<String> findDistinctLocationNames(
            @Param("userId") UUID userId,
            @Param("petId") UUID petId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("""
            SELECT mm.locationName, AVG(mm.energyLevel), COUNT(DISTINCT mm.memory.id)
            FROM MemoryMoment mm
            WHERE mm.memory.user.id = :userId
              AND mm.memory.memoryDate BETWEEN :start AND :end
              AND mm.locationName IS NOT NULL
              AND mm.locationName != ''
              AND mm.energyLevel IS NOT NULL
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = mm.memory AND md.dog.id = :petId
              ))
            GROUP BY mm.locationName
            ORDER BY COUNT(DISTINCT mm.memory.id) DESC
            """)
    List<Object[]> findLocationEnergyStats(
            @Param("userId") UUID userId,
            @Param("petId") UUID petId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("""
            SELECT mm.category, COUNT(mm)
            FROM MemoryMoment mm
            WHERE mm.memory.user.id = :userId
              AND mm.memory.memoryDate BETWEEN :start AND :end
              AND mm.category IS NOT NULL
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = mm.memory AND md.dog.id = :petId
              ))
            GROUP BY mm.category
            """)
    List<Object[]> findCategoryDistribution(
            @Param("userId") UUID userId,
            @Param("petId") UUID petId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}
