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

@Slf4j // 로그를 찍을 수 있게 해줍니다.
@RequiredArgsConstructor
@Service // 스프링의 서비스 빈으로 등록합니다.
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final MemberRepository memberRepository; // DB에 접근할 도구

    // 카카오 로그인 인증이 성공한 뒤, 카카오가 보내준 정보를 바탕으로 우리 서버의 후속 작업을 수행합니다.
    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // 1. 기본 서비스를 통해 카카오 사용자 정보를 가져옵니다. (통신 발생)
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // 2. 어떤 서비스(kakao)를 통해 로그인했는지 ID를 가져옵니다.
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        // 3. 카카오 로그인 시 고유 식별자가 되는 키(PK)의 이름을 가져옵니다.
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        log.info("카카오 로그인 시도 - registrationId: {}, attributes: {}", registrationId, oAuth2User.getAttributes());

        // 4. 카카오에서 준 복잡한 데이터를 우리가 쓰기 편한 'OAuthAttributes' 객체로 변환합니다.
        OAuthAttributes attributes = OAuthAttributes.ofKakao(userNameAttributeName, oAuth2User.getAttributes());

        // 5. 사용자가 DB에 있으면 업데이트하고, 없으면 새로 저장(회원가입)합니다.
        Member member = saveOrUpdate(attributes);

        // 6. 스프링 시큐리티에서 쓸 수 있는 OAuth2User 객체를 만들어 리턴합니다.
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(member.getRole().getKey())), // 권한(ROLE_USER 등)
                attributes.getAttributes(), // 카카오 원본 데이터
                attributes.getNameAttributeKey()); // 식별자 키값
    }

    // 이미 가입된 회원이면 이름이나 프로필 사진이 바뀌었을 때 업데이트하고, 아니면 신규 가입시킵니다.
    private Member saveOrUpdate(OAuthAttributes attributes) {
        Member member = memberRepository.findByKakaoId(attributes.getKakaoId())
                // DB에 있으면 꺼내서 이름과 프로필 사진을 최신화(update)합니다.
                .map(entity -> entity.update(attributes.getNickname(), attributes.getProfileImagePath()))
                // DB에 없으면(처음 로그인) 새로운 회원 엔티티를 만듭니다(toEntity).
                .orElse(attributes.toEntity());

        // 최종적으로 DB에 저장합니다.
        return memberRepository.save(member);
    }
}
