'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Save, Sun, Moon, Monitor, UserX } from 'lucide-react';
import { useTheme } from 'next-themes';
import clientApi from '@/app/common/lib/clientApi';
import { useToast } from '@/app/common/hooks/useToast';
import { useConfirm } from '@/app/common/hooks/useConfirm';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  const { confirm } = useConfirm();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);

    clientApi.get('/api/members/me')
      .then(res => setAiContext(res.data?.data?.aiContext ?? ''))
      .catch(() => error('설정을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [error]);

  if (!mounted) {
    return null;
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    success(`${newTheme === 'light' ? '라이트' : newTheme === 'dark' ? '다크' : '시스템'} 모드로 설정되었습니다.`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await clientApi.put('/api/members/me/ai-context', { aiContext });
      success('저장되었습니다.');
    } catch {
      error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    const confirmed = await confirm('정말로 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터는 즉시 파기되며 복구할 수 없습니다.');
    if (confirmed) {
      try {
        await clientApi.delete('/api/members/me');
        success('그동안 이용해주셔서 감사합니다.');
        window.location.href = '/login';
      } catch {
        error('탈퇴 처리 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-6 lg:p-10 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-black text-text-main tracking-tight">설정</h1>
        <p className="text-sm text-text-sub mt-1">앱 환경과 개인화된 기능을 관리하세요.</p>
      </div>

      {/* 1. 라이트/다크모드 */}
      <section className="bg-background rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-10 h-10 rounded-xl bg-main-green/10 flex items-center justify-center shrink-0">
            {resolvedTheme === 'dark' ? <Moon className="w-5 h-5 text-main-green" /> : <Sun className="w-5 h-5 text-main-green" />}
          </div>
          <div>
            <h2 className="font-black text-text-main text-[16px]">라이트/다크모드</h2>
            <p className="text-[12px] text-text-sub">화면 테마를 설정하세요.</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex gap-2">
            {[
              { id: 'light', label: '라이트', icon: Sun },
              { id: 'dark', label: '다크', icon: Moon },
              { id: 'system', label: '시스템', icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleThemeChange(id)}
                className={`flex-1 md:w-28 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition text-sm font-bold ${
                  theme === id
                    ? 'border-main-green bg-main-green/5 text-main-green'
                    : 'border-border bg-background text-text-sub hover:bg-surface-green/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          {theme === 'system' && (
            <p className="text-xs text-text-sub text-right">
              감지된 브라우저 모드: <span className="font-bold text-main-green">{resolvedTheme === 'dark' ? '다크' : '라이트'}</span>
            </p>
          )}
        </div>
      </section>

      {/* 2. AI 개인 컨텍스트 */}
      <section className="bg-background rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-main-green/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-main-green" />
            </div>
            <div>
              <h2 className="font-black text-text-main text-[16px]">AI 개인 컨텍스트</h2>
              <p className="text-[12px] text-text-sub">모든 AI 기능에 반영될 나의 특별한 상황을 입력하세요.</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-main-green text-white rounded-xl text-sm font-bold hover:bg-main-green/90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        <textarea
          value={loading ? '' : aiContext}
          onChange={e => setAiContext(e.target.value)}
          disabled={loading}
          rows={5}
          placeholder="AI에게 추가적으로 알려줄 정보를 작성해주세요.&#10;(예시: 아이들에게 저는 언니로 여겨져요 / 우리집은 4층 계단이라 산책할 때 체력 소모가 많아요)"
          className="w-full rounded-xl border border-border bg-surface-green/30 px-4 py-3 text-sm text-text-main placeholder:text-text-sub/60 resize-none focus:outline-none focus:ring-2 focus:ring-main-green/40 transition disabled:opacity-50"
        />

        <div className="flex justify-end md:hidden">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-main-green text-white rounded-xl text-sm font-bold hover:bg-main-green/90 transition disabled:opacity-50 w-full justify-center"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </section>

      {/* 3. 회원탈퇴 */}
      <section className="bg-background rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="font-black text-text-main text-[16px]">회원탈퇴</h2>
            <p className="text-[12px] text-text-sub">계정을 삭제하고 모든 데이터를 파기합니다.</p>
          </div>
        </div>

        <button
          onClick={handleWithdraw}
          className="px-6 py-2.5 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition border border-red-100 dark:border-red-900/30 w-full md:w-auto"
        >
          탈퇴하기
        </button>
      </section>
    </div>
  );
}
