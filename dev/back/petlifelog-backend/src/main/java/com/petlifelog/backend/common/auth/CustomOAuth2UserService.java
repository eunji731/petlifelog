package com.petlifelog.backend.common.auth;

import com.petlifelog.backend.common.auth.dto.OAuthAttributes;
import com.petlifelog.backend.domain.member.Member;
import com.petlifelog.backend.domain.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

/**
 * [카카오 사용자 정보 처리 서비스]
 * 사용자가 카카오 로그인창에서 로그인을 마친 직후,
 * 카카오가 우리에게 던져준 사용자 정보(이름, 이메일, 프로필 등)를 처리하는 곳입니다.
 */
@Slf4j
@RequiredArgsConstructor
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 기본 서비스를 생성하여 카카오로부터 사용자 정보를 실제로 가져옵니다.
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService(); // 기본 OAuth2 사용자 정보 조회기를 하나 만든다.
        OAuth2User oAuth2User = delegate.loadUser(userRequest); // 카카오 access token을 사용해서 카카오 사용자 정보를 가져온다.

        log.info("카카오 refresh token 만료까지 남은 시간: {}", userRequest.getAdditionalParameters());
        log.info("카카오에서 가져오는 정보: {}", oAuth2User.getAttributes());

        // 2. 현재 어떤 서비스(kakao 등)를 통해 로그인 중인지 구분 ID를 가져옵니다.
        // /oauth2/authorization/{registrationId} 요청의 마지막 값(kakao)이 OAuth 제공자 구분값이 된다.
        // Spring Security는 이 registrationId로 application.yml의 registration.kakao 설정을 찾아 로그인 흐름을 진행한다.
        // 그래서 loadUser() 안에서도 userRequest.getClientRegistration().getRegistrationId()로 kakao인지 google인지 알 수 있다.
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        
        // 3. 카카오 로그인 시 사용자를 식별할 수 있는 고유 키(PK)의 이름을 가져옵니다. (카카오는 보통 'id')
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        log.info("카카오 로그인 시도 - registrationId: {}, attributes: {}", registrationId, oAuth2User.getAttributes());

        // 4. 카카오가 준 복잡한 JSON 데이터를 우리가 쓰기 편한 'OAuthAttributes' 객체로 깔끔하게 정리합니다.
        OAuthAttributes attributes = OAuthAttributes.ofKakao(userNameAttributeName, oAuth2User.getAttributes());

        // 5. 정리된 사용자 정보를 DB에 저장하거나, 이미 있다면 정보를 업데이트(이름 변경 등)합니다.
        Member member = saveOrUpdate(attributes);

        // 6. 마지막으로 스프링 시큐리티 시스템이 이해할 수 있는 유저 객체(DefaultOAuth2User)로 변환해서 리턴합니다.
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(member.getRole())), // 사용자의 권한 (예: ROLE_USER)
                attributes.getAttributes(), // 카카오에서 준 원본 데이터 전체
                attributes.getNameAttributeKey()); // 사용자를 식별할 고유 키값
    }

    /**
     * [사용자 저장 및 업데이트 로직]
     * 이미 가입된 회원이면 이름이나 프로필 사진을 최신화하고, 처음 온 사람이면 새로 회원가입시킵니다.
     */
    private Member saveOrUpdate(OAuthAttributes attributes) {
        Member member = memberRepository.findByKakaoId(attributes.getKakaoId())
                .map(entity -> {
                    if (entity.getIsActive()) {
                        entity.update(attributes.getNickname(), attributes.getProfileImagePath());
                    }
                    // 탈퇴 회원은 변경 없이 그대로 반환 (OAuth2SuccessHandler에서 재가입 흐름으로 분기)
                    return entity;
                })
                .orElse(attributes.toEntity());

        return memberRepository.save(member);
    }
}
