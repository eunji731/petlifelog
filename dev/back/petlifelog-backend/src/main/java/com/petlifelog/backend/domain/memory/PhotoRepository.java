package com.petlifelog.backend.domain.memory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {

    Optional<Photo> findByMemoryAndSortOrder(Memory memory, int sortOrder);
}
