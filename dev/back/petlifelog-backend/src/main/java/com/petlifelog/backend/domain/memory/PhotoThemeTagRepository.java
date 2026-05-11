package com.petlifelog.backend.domain.memory;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PhotoThemeTagRepository extends JpaRepository<PhotoThemeTag, UUID> {

    @Query("""
            SELECT pt.tag, COUNT(pt) as cnt
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
            SELECT pt.tag FROM PhotoThemeTag pt
            WHERE pt.photo.id = :photoId
            """)
    List<String> findTagsByPhotoId(@Param("photoId") UUID photoId);

    // 테마 대표 사진: 각 태그 중 vibeScore 가장 높은 사진 경로 조회
    @Query("""
            SELECT p.pathOrigin FROM Photo p
            JOIN PhotoThemeTag pt ON pt.photo = p
            JOIN p.memory m
            WHERE m.user.id = :userId
              AND pt.tag = :tag
            ORDER BY p.vibeScore DESC NULLS LAST
            LIMIT 1
            """)
    String findRepresentativePhotoByTag(@Param("userId") UUID userId, @Param("tag") String tag);

    // 키워드로 태그 부분 검색 → 매칭되는 사진 목록
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

    // 자동완성용: 키워드에 매칭되는 태그명 목록
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

    // 키워드로 태그 부분 검색 → 테마(태그) 목록 (count 포함)
    @Query("""
            SELECT pt.tag, COUNT(pt) as cnt
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
