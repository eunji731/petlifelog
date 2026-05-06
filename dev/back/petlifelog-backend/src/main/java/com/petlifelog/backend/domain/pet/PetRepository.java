package com.petlifelog.backend.domain.pet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PetRepository extends JpaRepository<Pet, UUID> {
    List<Pet> findByUserIdAndIsActiveTrue(UUID userId);
}
