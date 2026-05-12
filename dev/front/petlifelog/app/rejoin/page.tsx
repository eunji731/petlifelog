'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import clientApi from '@/app/common/lib/clientApi';

function RejoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  const handleConfirm = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await clientApi.post('/api/members/rejoin', { token });
      router.replace('/');
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.replace('/login');
  };

  const showError = !token || apiError;

  return (
    <div className="relative z-10 w-full max-w-md bg-white rounded-[32px] shadow-xl p-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-24 h-24 mb-6">
        <Image src="/logo_simple.png" alt="logo" fill className="object-contain" />
      </div>

      {showError ? (
        <>
          <h2 className="text-xl font-black text-text-main mb-2">링크가 만료되었습니다</h2>
          <p className="text-sm text-text-sub mb-8">
            재가입 링크는 10분간만 유효합니다.<br />다시 카카오 로그인을 시도해주세요.
          </p>
          <button
            onClick={handleCancel}
            className="w-full py-4 bg-main-green text-white font-black rounded-2xl hover:bg-main-green/90 transition"
          >
            로그인으로 돌아가기
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-black text-text-main mb-2">다시 돌아오셨군요!</h2>
          <p className="text-sm text-text-sub mb-8">
            이전에 탈퇴한 계정이 확인되었습니다.<br />
            기존 데이터를 복구하고 재가입하시겠습니까?
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 py-4 bg-background text-text-sub font-black rounded-2xl hover:bg-border transition disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-4 bg-main-yellow text-white font-black rounded-2xl shadow-lg shadow-main-yellow/20 hover:scale-105 transition disabled:opacity-50"
            >
              {loading ? '처리 중...' : '재가입하기'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function RejoinPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-light-yellow/30 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-light-green/20 rounded-full blur-3xl opacity-60" />
      <Suspense fallback={null}>
        <RejoinContent />
      </Suspense>
    </div>
  );
}
