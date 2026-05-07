package com.petlifelog.backend.domain.pet;

import com.petlifelog.backend.common.file.domain.ParentDomainType;
import com.petlifelog.backend.common.file.service.AttachedFileService;
import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.MemberRepository;
import com.petlifelog.backend.domain.pet.dto.PetRequest;
import com.petlifelog.backend.domain.pet.dto.PetResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
@Transactional(readOnly = true)
public class PetService {

    private final PetRepository petRepository;
    private final MemberRepository memberRepository;
    private final AttachedFileService attachedFileService;

    public List<PetResponse> getPets(UUID userId) {
        return petRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

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
                pet.getProfileImagePath(),   // 사진은 파일 API가 관리하므로 기존값 유지
                request.getTraits(),
                request.getAppearance(),
                request.getLikes(),
                request.getDislikes(),
                request.getDiaryTone()
        );

        return toResponse(pet);
    }

    @Transactional
    public void deletePet(UUID petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException("반려동물 정보를 찾을 수 없습니다."));
        attachedFileService.deleteAllByParent(ParentDomainType.PET_PROFILE, petId);
        pet.delete();
    }

    // AttachedFile 에 등록된 사진이 있으면 우선 사용, 없으면 profileImagePath 로 fallback
    private PetResponse toResponse(Pet pet) {
        String photoUrl = attachedFileService.getFiles(ParentDomainType.PET_PROFILE, pet.getId())
                .stream()
                .findFirst()
                .map(f -> f.getFileUrl())
                .orElse(pet.getProfileImagePath());
        return PetResponse.from(pet, photoUrl);
    }
}
