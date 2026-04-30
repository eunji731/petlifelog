'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KakaoCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // HttpOnly 쿠키는 브라우저가 자동으로 관리하므로 별도 저장 불필요
        // 백엔드에서 쿠키 설정 후 이 페이지로 리다이렉트됨
        router.replace('/');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-sub-text">로그인 처리 중...</p>
        </div>
    );
}
