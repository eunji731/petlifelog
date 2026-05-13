package com.petlifelog.backend.domain.memory.repository;

import com.petlifelog.backend.domain.memory.domain.MemoryDog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MemoryDogRepository extends JpaRepository<MemoryDog, UUID> {
}
