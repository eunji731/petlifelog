package com.petlifelog.backend.domain.pet;

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

    public List<PetResponse> getPets(UUID userId) {
        return petRepository.findByUserIdAndIsActiveTrue(userId)
                .stream()
                .map(PetResponse::from)
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
                .profileImagePath(request.getPhoto())
                .personality(request.getTraits())
                .appearance(request.getAppearance())
                .likes(request.getLikes())
                .dislikes(request.getDislikes())
                .diaryTone(request.getDiaryTone())
                .build();

        return PetResponse.from(petRepository.save(pet));
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
                request.getPhoto(),
                request.getTraits(),
                request.getAppearance(),
                request.getLikes(),
                request.getDislikes(),
                request.getDiaryTone()
        );

        return PetResponse.from(pet);
    }

    @Transactional
    public void deletePet(UUID petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException("반려동물 정보를 찾을 수 없습니다."));
        pet.delete();
    }
}
