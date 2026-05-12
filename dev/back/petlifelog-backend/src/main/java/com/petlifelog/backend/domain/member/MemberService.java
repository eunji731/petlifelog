package com.petlifelog.backend.domain.member;

import com.petlifelog.backend.common.auth.JwtTokenProvider;
import com.petlifelog.backend.domain.pet.Pet;
import com.petlifelog.backend.domain.pet.PetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final PetRepository petRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public void withdraw(UUID memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<Pet> pets = petRepository.findByUserIdAndIsActiveTrue(memberId);
        pets.forEach(Pet::delete);

        member.withdraw();
    }

    @Transactional
    public Member rejoin(String rejoinToken) {
        if (!jwtTokenProvider.isRejoinToken(rejoinToken)) {
            throw new IllegalArgumentException("유효하지 않은 재가입 토큰입니다.");
        }

        String memberId = jwtTokenProvider.getUserId(rejoinToken);
        Member member = memberRepository.findById(UUID.fromString(memberId))
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (member.getIsActive()) {
            throw new IllegalArgumentException("이미 활성화된 계정입니다.");
        }

        member.reactivate(member.getNickname(), member.getProfileImagePath());
        petRepository.findByUserId(member.getId()).forEach(Pet::restore);

        return member;
    }
}
