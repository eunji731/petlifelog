package com.petlifelog.backend.domain.memory.repository;

import com.petlifelog.backend.domain.memory.domain.Photo;
import com.petlifelog.backend.domain.memory.domain.PhotoThemeTag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PhotoThemeTagRepository extends JpaRepository<PhotoThemeTag, UUID> {

    @Query("""
            SELECT pt.tag, COUNT(pt) as cnt,
              (SELECT p2.pathOrigin FROM Photo p2
               JOIN PhotoThemeTag pt2 ON pt2.photo = p2
               JOIN p2.memory m2
               WHERE m2.user.id = :userId AND pt2.tag = pt.tag
                 AND (:petId IS NULL OR EXISTS (
                       SELECT md2 FROM MemoryDog md2 WHERE md2.memory = m2 AND md2.dog.id = :petId
                 ))
               ORDER BY p2.vibeScore DESC NULLS LAST
               LIMIT 1) as repPhotoUrl
            FROM PhotoThemeTag pt
            JOIN pt.photo p
            JOIN p.memory m
            WHERE m.user.id = :userId
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = m AND md.dog.id = :petId
              ))
            GROUP BY pt.tag
            ORDER BY cnt DESC
            """)
    List<Object[]> findTopTags(@Param("userId") UUID userId, @Param("petId") UUID petId, Pageable pageable);

    @Query("""
            SELECT p FROM Photo p
            JOIN PhotoThemeTag pt ON pt.photo = p
            JOIN p.memory m
            WHERE m.user.id = :userId
              AND pt.tag = :tag
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = m AND md.dog.id = :petId
              ))
            ORDER BY p.vibeScore DESC NULLS LAST, m.memoryDate DESC
            """)
    List<Photo> findPhotosByTag(
            @Param("userId") UUID userId,
            @Param("tag") String tag,
            @Param("petId") UUID petId
    );

    @Query("""
            SELECT DISTINCT p FROM Photo p
            JOIN PhotoThemeTag pt ON pt.photo = p
            JOIN p.memory m
            WHERE m.user.id = :userId
              AND LOWER(pt.tag) LIKE LOWER(CONCAT('%', :keyword, '%'))
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = m AND md.dog.id = :petId
              ))
            ORDER BY p.vibeScore DESC NULLS LAST, m.memoryDate DESC
            """)
    List<Photo> searchPhotosByTagKeyword(
            @Param("userId") UUID userId,
            @Param("keyword") String keyword,
            @Param("petId") UUID petId
    );

    @Query("""
            SELECT DISTINCT pt.tag FROM PhotoThemeTag pt
            JOIN pt.photo p
            JOIN p.memory m
            WHERE m.user.id = :userId
              AND LOWER(pt.tag) LIKE LOWER(CONCAT('%', :q, '%'))
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = m AND md.dog.id = :petId
              ))
            ORDER BY pt.tag ASC
            """)
    List<String> suggestTags(
            @Param("userId") UUID userId,
            @Param("q") String q,
            @Param("petId") UUID petId,
            Pageable pageable
    );

    @Query("""
            SELECT pt.tag, COUNT(pt) as cnt,
              (SELECT p2.pathOrigin FROM Photo p2
               JOIN PhotoThemeTag pt2 ON pt2.photo = p2
               JOIN p2.memory m2
               WHERE m2.user.id = :userId AND pt2.tag = :tag
               ORDER BY p2.vibeScore DESC NULLS LAST
               LIMIT 1) as repPhotoUrl
            FROM PhotoThemeTag pt
            JOIN pt.photo p
            JOIN p.memory m
            WHERE m.user.id = :userId
              AND pt.tag = :tag
            GROUP BY pt.tag
            """)
    List<Object[]> findTagSummary(@Param("userId") UUID userId, @Param("tag") String tag);

    @Query("""
            SELECT pt.tag, COUNT(pt) as cnt,
              (SELECT p2.pathOrigin FROM Photo p2
               JOIN PhotoThemeTag pt2 ON pt2.photo = p2
               JOIN p2.memory m2
               WHERE m2.user.id = :userId AND pt2.tag = pt.tag
                 AND (:petId IS NULL OR EXISTS (
                       SELECT md2 FROM MemoryDog md2 WHERE md2.memory = m2 AND md2.dog.id = :petId
                 ))
               ORDER BY p2.vibeScore DESC NULLS LAST
               LIMIT 1) as repPhotoUrl
            FROM PhotoThemeTag pt
            JOIN pt.photo p
            JOIN p.memory m
            WHERE m.user.id = :userId
              AND LOWER(pt.tag) LIKE LOWER(CONCAT('%', :keyword, '%'))
              AND (:petId IS NULL OR EXISTS (
                    SELECT md FROM MemoryDog md WHERE md.memory = m AND md.dog.id = :petId
              ))
            GROUP BY pt.tag
            ORDER BY cnt DESC
            """)
    List<Object[]> searchThemesByKeyword(
            @Param("userId") UUID userId,
            @Param("keyword") String keyword,
            @Param("petId") UUID petId
    );
}
