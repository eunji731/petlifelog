package com.petlifelog.backend.domain.pet.service;

import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.service.AttachedFileService;
import com.petlifelog.backend.domain.member.domain.Member;
import com.petlifelog.backend.domain.member.repository.MemberRepository;
import com.petlifelog.backend.domain.pet.domain.Pet;
import com.petlifelog.backend.domain.pet.dto.PetRequest;
import com.petlifelog.backend.domain.pet.dto.PetResponse;
import com.petlifelog.backend.domain.pet.repository.PetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * [반려동물 서비스]
 *
 * 반려동물 CRUD 비즈니스 로직을 처리합니다.
 * 프로필 사진은 AttachedFile 시스템을 통해 관리됩니다.
 *
 * ▶ 사진 조회 우선순위
 *   1. AttachedFile 테이블의 첨부 파일 (최신 방식)
 *   2. pet.profileImagePath 필드 (구버전 호환)
 *
 * ▶ 삭제 정책
 *   소프트 삭제(isActive = false)로 실제 데이터는 유지됩니다.
 *   첨부 파일(프로필 사진)은 물리적으로 삭제됩니다.
 */
@RequiredArgsConstructor
@Service
@Transactional(readOnly = true) // 기본적으로 읽기 전용 트랜잭션, 변경 메서드는 @Transactional 추가
public class PetService {

    private final PetRepository petRepository;
    private final MemberRepository memberRepository;
    private final AttachedFileService attachedFileService;

    /**
     * 사용자의 활성 반려동물 목록을 반환합니다.
     * isActive = true인 반려동물만 조회합니다.
     */
    public List<PetResponse> getPets(UUID userId) {
        return petRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * 새 반려동물을 등록합니다.
     * PetRequest의 모든 필드를 Pet 엔티티에 매핑하여 저장합니다.
     */
    @Transactional
    public PetResponse addPet(UUID userId, PetRequest request) {
        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Pet pet = Pet.builder()
                .user(member)
                .name(request.getName())
                .breed(request.getBreed())
                .birthDate(request.getBirthDate())
                .adoptionDate(request.getAdoptionDate())
                .gender(request.getGender())
                .weightKg(request.getWeightKg())
                .personality(request.getTraits())
                .appearance(request.getAppearance())
                .likes(request.getLikes())
                .dislikes(request.getDislikes())
                .diaryTone(request.getDiaryTone())
                .build();

        return toResponse(petRepository.save(pet));
    }

    /**
     * 반려동물 정보를 전체 업데이트합니다.
     * 프로필 이미지 경로는 별도 API(/api/files)로 관리되어 여기서는 기존 값을 유지합니다.
     */
    @Transactional
    public PetResponse updatePet(UUID petId, PetRequest request) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException("반려동물 정보를 찾을 수 없습니다."));

        pet.updateAll(
                request.getName(),
                request.getBreed(),
                request.getBirthDate(),
                request.getAdoptionDate(),
                request.getGender(),
                request.getWeightKg(),
                pet.getProfileImagePath(), // 이미지 경로는 유지 (파일 API에서 별도 처리)
                request.getTraits(),
                request.getAppearance(),
                request.getLikes(),
                request.getDislikes(),
                request.getDiaryTone()
        );

        return toResponse(pet);
    }

    /**
     * 반려동물을 소프트 삭제합니다.
     * 첨부 파일(프로필 사진)은 물리적으로 삭제되고, Pet 엔티티는 isActive = false로 변경됩니다.
     */
    @Transactional
    public void deletePet(UUID petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException("반려동물 정보를 찾을 수 없습니다."));
        // 프로필 사진 파일 삭제
        attachedFileService.deleteAllByParent(ParentDomainType.PET_PROFILE, petId);
        // 소프트 삭제 (isActive = false)
        pet.delete();
    }

    /**
     * Pet 엔티티 → PetResponse DTO 변환.
     * 사진은 AttachedFile 테이블 우선, 없으면 profileImagePath 필드를 사용합니다.
     */
    private PetResponse toResponse(Pet pet) {
        String photoUrl = attachedFileService.getFiles(ParentDomainType.PET_PROFILE, pet.getId())
                .stream()
                .findFirst()
                .map(f -> f.getFileUrl())
                .orElse(pet.getProfileImagePath()); // AttachedFile이 없으면 기존 필드 사용 (하위 호환)
        return PetResponse.from(pet, photoUrl);
    }
}
