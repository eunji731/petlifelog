'use client'; // 클라이언트 사이드에서 실행되는 컴포넌트임을 선언합니다.

import { useEffect } from 'react'; // 컴포넌트가 렌더링될 때 특정 작업을 수행하기 위한 훅입니다.
import { useRouter, useSearchParams } from 'next/navigation'; // 페이지 이동과 URL 파라미터 읽기를 위한 훅입니다.

export default function KakaoCallbackPage() {
    const router = useRouter(); // 페이지 이동을 처리하는 객체입니다.
    const searchParams = useSearchParams(); // URL 쿼리 스트링(예: ?accessToken=...)을 가져오는 객체입니다.

    useEffect(() => {
        // 백엔드(Spring Security)에서 인증 성공 후 보낸 URL 파라미터에서 토큰들을 읽어옵니다.
        const accessToken = searchParams.get('accessToken'); // URL에서 'accessToken' 값을 가져옵니다.
        const refreshToken = searchParams.get('refreshToken'); // URL에서 'refreshToken' 값을 가져옵니다.

        // 토큰이 정상적으로 존재하면 (로그인 성공 시)
        if (accessToken && refreshToken) {
            // 브라우저의 로컬 스토리지에 토큰을 저장하여, 이후 API 요청 시 사용할 수 있게 합니다.
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            // 저장이 완료되면 메인 페이지('/')로 리다이렉트합니다.
            router.replace('/');
        } else {
            // 토큰이 없다면 로그인이 실패한 것이므로 다시 로그인 페이지로 보냅니다.
            router.replace('/login');
        }
    }, [router, searchParams]); // router나 searchParams가 변경될 때마다 이 로직을 실행합니다.

    return (
        // 토큰 처리 중(찰나의 순간) 사용자에게 보여줄 대기 화면입니다.
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-sub-text">로그인 처리 중...</p>
        </div>
    );
}
