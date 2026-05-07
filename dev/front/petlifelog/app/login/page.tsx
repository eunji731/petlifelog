'use client'; // 클라이언트 사이드에서 실행되는 컴포넌트임을 선언합니다.

import React from 'react'; // React 라이브러리를 가져옵니다.
import Image from 'next/image'; // Next.js의 최적화된 이미지 컴포넌트를 가져옵니다.

// 백엔드 서버의 주소를 환경 변수에서 가져오거나 기본값(localhost:8080)을 사용합니다.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export default function LoginPage() {
    // 카카오 로그인 버튼을 눌렀을 때 실행되는 함수입니다.
    const handleKakaoLogin = () => {
        // 사용자를 백엔드의 카카오 인증 시작 주소로 이동시킵니다.
        // Spring Security OAuth2를 사용하면 보통 '/oauth2/authorization/{provider}' 형식을 사용합니다.
        // 이 주소로 가면 백엔드가 사용자를 카카오의 실제 로그인 페이지로 알아서 보내줍니다.
        window.location.href = `${BACKEND_URL}/oauth2/authorization/kakao`; //git 확인용
    };

    return (
        // 전체 화면을 채우는 배경과 레이아웃 설정입니다.
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col md:flex-row items-center justify-center p-6 md:p-12">

            {/* 배경에 들어가는 디자인 요소들입니다 (노란색/초록색 원형 블러) */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-light-yellow/30 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-light-green/20 rounded-full blur-3xl opacity-60"></div>

            {/* 메인 콘텐츠를 담는 컨테이너입니다. */}
            <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-center gap-16 md:gap-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">

                {/* 왼쪽 영역: 브랜드 로고와 서비스 설명 문구입니다. */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="relative w-40 h-40 md:w-56 md:h-56 mb-8 drop-shadow-sm hover:scale-105 transition-transform duration-500">
                        <Image
                            src="/logo_simple.png" // 로고 이미지 경로입니다.
                            alt="petLifeLog Logo" // 이미지 설명입니다.
                            fill // 부모 요소를 꽉 채우게 설정합니다.
                            className="object-contain" // 이미지 비율을 유지하면서 영역 안에 맞춥니다.
                            priority // 페이지 로드 시 최우선으로 로딩합니다.
                        />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight">
                            Pet<span className="text-main-green">Life</span>Log
                        </h1>
                        <p className="text-xl md:text-2xl text-sub-text font-medium leading-relaxed max-w-lg">
                            햇살처럼 따뜻하게 기록하는<br />
                            우리 아이와의 소중한 일상
                        </p>
                    </div>

                    {/* 서비스 기능 배지 리스트입니다. */}
                    <div className="hidden md:flex gap-3 mt-12">
                        {['🗓️ 포토 캘린더', '📍 산책 포토맵', '✍️ AI 멍멍일기', '🍱 스마트 도감'].map((feature) => (
                            <div key={feature} className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-2xl text-sm text-main-green border border-light-green/50 font-semibold shadow-sm hover:shadow-md transition-all">
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 오른쪽 영역: 로그인 섹션입니다. */}
                <div className="w-full max-w-md flex flex-col gap-8 md:gap-10">
                    <div className="space-y-6 md:space-y-8">
                        <div className="hidden md:block text-center md:text-left space-y-2 md:space-y-3">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">로그인</h2>
                            <p className="text-base md:text-lg text-sub-text">카카오 계정으로 간편하게 시작하세요.</p>
                        </div>

                        <div className="flex flex-col gap-4 md:gap-5">
                            {/* 실제 로그인 요청을 보내는 카카오 버튼입니다. */}
                            <button
                                className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] h-16 rounded-2xl flex items-center justify-center gap-4 font-bold text-lg transition-all shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                                onClick={handleKakaoLogin}
                            >
                                {/* 카카오 로고 아이콘 SVG입니다. */}
                                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 3c-4.97 0-9 3.181-9 7.105 0 2.53 1.704 4.753 4.322 6.011l-.837 3.08c-.105.386.121.78.503.877.13.033.264.032.392-.005l3.637-2.394c.324.024.653.036.983.036 4.97 0 9-3.181 9-7.105S16.97 3 12 3z" />
                                </svg>
                                카카오톡으로 시작하기
                            </button>

                            <div className="space-y-4">
                                <p className="text-sm text-sub-text text-center px-6 leading-relaxed">
                                    별도의 가입 절차 없이<br />
                                    기존 카카오 계정으로 바로 이용 가능합니다.
                                </p>
                                <div className="flex items-center justify-center gap-6 text-xs text-sub-text/80 font-medium pt-4">
                                    <span className="hover:text-foreground cursor-pointer transition-colors border-b border-transparent hover:border-sub-text">이용약관</span>
                                    <div className="w-1 h-1 bg-sub-text/30 rounded-full"></div>
                                    <span className="hover:text-foreground cursor-pointer transition-colors border-b border-transparent hover:border-sub-text font-bold text-sub-text">개인정보처리방침</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center md:text-left text-xs text-sub-text/50">
                        © 2026 petLifeLog. All rights reserved.
                    </p>
                </div>

            </div>
        </div>
    );
}
