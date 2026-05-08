package com.petlifelog.backend.domain.memory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MemoryMomentRepository extends JpaRepository<MemoryMoment, UUID> {
}
