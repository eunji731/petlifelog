'use client';

import React, { useState, createContext, useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar, Heart, Sparkles, Zap, Plus,
  TrendingUp, MapPin, Flame, RefreshCw,
  ArrowUp, ArrowDown, Minus, PartyPopper, Trophy,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { usePet, ALL_PETS_ID } from '@/app/common/hooks/usePet';
import { useDashboard } from '@/app/common/hooks/useDashboard';
import { getImagePath } from '@/app/common/lib/clientApi';
import DateDropdown from '@/app/calendar/components/DateDropdown';

type DashboardCtxType = ReturnType<typeof useDashboard>;
const DashboardCtx = createContext<DashboardCtxType | null>(null);
function useDash() {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error('DashboardCtx not provided');
  return ctx;
}

// ─── 스켈레톤 ───────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-white/10 rounded-xl ${className}`} />;
}

// ─── 월 네비게이터 ──────────────────────────────────────────────────────────

function MonthNavigator() {
  const { selectedYear, selectedMonth, isCurrentMonth, goToPrevMonth, goToNextMonth, goToDate } = useDash();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const label = `${selectedYear}년 ${selectedMonth}월`;
  const currentDate = new Date(selectedYear, selectedMonth - 1);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goToPrevMonth}
        className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-surface-green transition-colors shadow-sm active:scale-90"
      >
        <ChevronLeft className="w-4 h-4 text-text-sub" />
      </button>
      
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`px-3 py-1 rounded-xl transition-all active:scale-95 ${
            isDropdownOpen ? 'bg-main-green/10 text-main-green' : 'hover:bg-main-green/5'
          }`}
        >
          <span className="text-sm font-black text-text-main min-w-[80px] text-center">{label}</span>
        </button>

        {isDropdownOpen && (
          <DateDropdown 
            currentDate={currentDate}
            onSelect={(y, m) => {
              goToDate(y, m);
              setIsDropdownOpen(false);
            }}
            onClose={() => setIsDropdownOpen(false)}
            align="right"
          />
        )}
      </div>

      <button
        onClick={goToNextMonth}
        disabled={isCurrentMonth}
        className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-surface-green transition-colors shadow-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
      >
        <ChevronRight className="w-4 h-4 text-text-sub" />
      </button>
    </div>
  );
}

// ─── 상단 카드 컴포넌트 ────────────────────────────────────────────────────────

// 1. 펫 프로필 카드
function PetProfileCard() {
  const { pets, selectedPetId } = usePet();
  const { summary, summaryLoading } = useDash();
  
  const petInfo = summary?.pet;
  const isAll = selectedPetId === ALL_PETS_ID;
  const primaryPet = pets.find(p => p.id === selectedPetId);
  const isBirthday = !isAll && petInfo?.birthdayDday === 0;

  if (summaryLoading) {
    return (
      <div className="bg-background rounded-[32px] border border-border shadow-sm p-6 h-full flex flex-col justify-center">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-[32px] border border-border shadow-sm p-6 h-full flex flex-col justify-center relative overflow-hidden group">
      {/* 배경 장식 (All Pets일 때만 살짝 노출) */}
      {isAll && (
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-surface-green rounded-full opacity-50 blur-2xl group-hover:scale-110 transition-transform" />
      )}

      <div className="flex items-center gap-4 relative z-10">
        <div className="relative w-16 h-16 shrink-0">
          {/* 사진 틀 (Ring & Shadow) */}
          <div className={`absolute inset-0 rounded-full shadow-sm ring-2 ${isBirthday ? 'ring-main-yellow' : 'ring-main-green/10'}`} />
          
          {/* 사진 컨테이너 (Border & Overflow) */}
          <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-background bg-background">
            {isAll ? (
              <div className="w-full h-full bg-gradient-to-br from-main-green to-deep-green flex items-center justify-center">
                <div className="relative">
                  <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
                  <Heart className="w-3 h-3 text-main-yellow fill-main-yellow absolute -right-1 -top-1" />
                </div>
              </div>
            ) : primaryPet ? (
              <Image src={getImagePath(primaryPet.photo, 'profiles')} alt={primaryPet.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-green flex items-center justify-center">
                <Plus className="w-6 h-6 text-main-green opacity-40" />
              </div>
            )}
          </div>
          {isBirthday && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-main-yellow rounded-full flex items-center justify-center shadow-sm z-20">
              <PartyPopper className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-black text-text-main truncate tracking-tight">
              {isAll ? '모든 가족' : petInfo?.name ?? '반려동물'}
            </h2>
            <div className="flex items-center gap-1.5">
              {isAll ? (
                <span className="text-xs font-bold text-main-green bg-surface-green px-2 py-0.5 rounded-full">
                  총 {pets.length}마리
                </span>
              ) : petInfo ? (
                <p className="text-xs font-bold text-text-sub truncate">
                  {petInfo.breed} · {petInfo.ageLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      {/* 하단 정보 영역: All Pets일 때는 다른 요약 정보를 보여줄 수도 있음 */}
      <div className="mt-4 pt-4 border-t border-dashed border-border flex items-center justify-between">
        {isAll ? (
          <>
            <span className="text-[11px] font-black text-text-sub">함께 만드는 추억</span>
            <span className="text-xs font-black text-main-green flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 우리 가족 화이팅!
            </span>
          </>
        ) : petInfo?.daysTogether != null ? (
          <>
            <span className="text-[11px] font-black text-text-sub">함께한 지</span>
            <span className="text-sm font-black text-main-green">D+{petInfo.daysTogether}</span>
          </>
        ) : (
          <span className="text-[11px] font-black text-text-sub opacity-40">기록을 시작해보세요</span>
        )}
      </div>
    </div>
  );
}

// 2. 활동 요약 카드
function ActivityStatsCard() {
  const { summary, summaryLoading, selectedYear, selectedMonth, isCurrentMonth } = useDash();
  const stats = summary?.monthlyStats;
  const monthLabel = isCurrentMonth ? '이달의 활동' : `${selectedMonth}월 활동`;

  const items = [
    { label: '기록', value: stats?.recordedDays ?? 0, unit: '일', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
    { label: '장소', value: stats?.visitedPlaces ?? 0, unit: '곳', icon: MapPin, color: 'text-main-green', bg: 'bg-green-50 dark:bg-green-900/10' },
    { label: '사진', value: stats?.bestPhotosCount ?? 0, unit: '장', icon: Sparkles, color: 'text-main-yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
  ];

  if (summaryLoading) {
    return (
      <div className="bg-background rounded-[32px] border border-border shadow-sm p-5 h-full">
        <Skeleton className="h-4 w-20 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-[32px] border border-border shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-text-main">{monthLabel}</h3>
        <span className="text-[10px] font-black text-text-sub opacity-60">전체 통계</span>
      </div>
      <div className="grid grid-cols-3 gap-3 flex-1">
        {items.map((item, i) => (
          <div key={i} className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-3 ${item.bg}`}>
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <div className="text-center">
              <p className="text-[10px] font-bold text-text-sub">{item.label}</p>
              <p className="text-base font-black text-text-main leading-none mt-1">
                {item.value}<span className="text-[10px] ml-0.5 font-bold">{item.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 3. 퀵 액션 카드 (기록하기 + 스트릭)
function QuickActionCard() {
  const { summary, summaryLoading } = useDash();
  const streak = summary?.streak;

  if (summaryLoading) {
    return <Skeleton className="rounded-[32px] h-full" />;
  }

  return (
    <Link 
      href="/calendar" 
      className="group bg-main-green rounded-[32px] p-5 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden relative h-full"
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
          <Flame className="w-4 h-4 text-main-yellow fill-main-yellow" />
          <span className="text-xs font-black">{streak?.current ?? 0}일 연속 기록 중</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
        </div>
      </div>

      <div className="relative z-10 mt-6 md:mt-0">
        <p className="text-xs font-bold opacity-80 mb-1">오늘도 소중한 추억을</p>
        <p className="text-xl font-black flex items-center gap-2">
          기록하기 <Zap className="w-5 h-5 text-main-yellow fill-main-yellow" />
        </p>
      </div>

      {/* 배경 장식 */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute -left-8 -top-8 w-20 h-20 bg-deep-green/20 rounded-full blur-xl" />
    </Link>
  );
}

// ─── 베스트 포토 ───────────────────────────────────────────────────────────

function BestPhotosStrip() {
  const { summary, summaryLoading } = useDash();
  const photos = (summary?.bestPhotos ?? []).slice(0, 4);

  if (summaryLoading) {
    return (
      <div className="space-y-4 flex-1 flex flex-col">
        <h2 className="text-lg font-black text-text-main flex items-center gap-2 px-1">
          <Trophy className="w-5 h-5 text-main-yellow fill-main-yellow" /> 베스트 포토
        </h2>
        <div className="grid grid-cols-2 gap-3 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <div className="space-y-4 flex-1 flex flex-col">
      <h2 className="text-lg font-black text-text-main flex items-center gap-2 px-1">
        <Trophy className="w-5 h-5 text-main-yellow fill-main-yellow" /> 베스트 포토
      </h2>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {photos.map((photo, i) => (
          <Link
            key={i}
            href={`/calendar?date=${photo.memoryDate}`}
            className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all border-2 border-background bg-background"
          >
            <Image
              src={getImagePath(photo.photoPath)}
              alt="베스트 사진"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-[9px] font-black text-white">
              {photo.vibeScore}
            </div>
            {photo.aiComment && (
              <p className="absolute bottom-2 left-2 right-2 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                {photo.aiComment}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── 자주 가는 곳 ──────────────────────────────────────────────────────────

function FavoritePlacesCard() {
  const { summary, summaryLoading } = useDash();
  const places = summary?.favoritePlaces ?? [];

  return (
    <div className="bg-background rounded-[32px] border border-border shadow-sm p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-text-main flex items-center gap-2">
          <MapPin className="w-5 h-5 text-main-green" /> 자주 가는 곳
        </h3>
        <span className="text-[10px] font-black text-text-sub">이번 달 기준</span>
      </div>
      {summaryLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : places.length === 0 ? (
        <p className="text-sm text-text-sub font-bold text-center py-4">이번 달 방문 기록이 없어요</p>
      ) : (
        <div className="space-y-3">
          {places.map((place, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                i === 0 ? 'bg-main-yellow text-white' : i === 1 ? 'bg-border text-text-sub' : i === 2 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-500' : 'bg-surface-green text-text-sub'
              }`}>
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-bold text-text-main truncate">{place.locationName}</span>
              <span className="text-xs font-black text-text-sub">{place.count}일</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI 섹션 ─────────────────────────────────────────────────────────────────

function AiEmptyState({ onRefresh, refreshing, remainingRefreshCount, recordCount }: {
  onRefresh: () => void;
  refreshing: boolean;
  remainingRefreshCount: number | null;
  recordCount: number | null;
}) {
  const { selectedYear, selectedMonth, isCurrentMonth } = useDash();
  const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const count = recordCount ?? 0;
  const hasEnoughRecords = count >= 3;

  const RefreshButton = () => (
    <div className="space-y-2">
      <button
        onClick={onRefresh}
        disabled={refreshing || remainingRefreshCount === 0}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-sm font-black transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? '생성 중...' : '리포트 생성'}
        {remainingRefreshCount !== null && !refreshing && (
          <span className="opacity-70">· 오늘 {remainingRefreshCount}회 남음</span>
        )}
      </button>
      {remainingRefreshCount === 0 && (
        <p className="text-xs font-bold opacity-50">오늘 새로고침 횟수를 모두 사용했어요</p>
      )}
    </div>
  );

  return (
    <div className="bg-deep-green rounded-[40px] p-10 text-white relative overflow-hidden h-full">
      <div className="relative z-10 text-center space-y-4 py-4">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-main-yellow fill-main-yellow" />
        </div>
        <p className="font-black text-lg">{yearMonth} 리포트</p>

        {isCurrentMonth && !hasEnoughRecords && (
          /* 이번 달, 기록 부족 */
          <p className="text-sm font-bold opacity-70 leading-relaxed">
            이번 달 기록이 3개 이상 쌓이면<br />AI가 자동으로 월간 리포트를 작성해 드려요!
          </p>
        )}

        {isCurrentMonth && hasEnoughRecords && (
          /* 이번 달, 기록 충분 → Gemini 실패 케이스 */
          <>
            <p className="text-sm font-bold opacity-70 leading-relaxed">
              리포트 생성 중 오류가 발생했어요.<br />새로고침 버튼을 눌러 다시 시도해 주세요.
            </p>
            <RefreshButton />
          </>
        )}

        {!isCurrentMonth && !hasEnoughRecords && (
          /* 이전 달, 기록 부족 */
          <p className="text-sm font-bold opacity-70 leading-relaxed">
            {selectedMonth}월 기록이 {count}개예요.<br />
            리포트 생성은 3개 이상의 기록이 필요해요.
          </p>
        )}

        {!isCurrentMonth && hasEnoughRecords && (
          /* 이전 달, 기록 충분 → 수동 생성 안내 */
          <>
            <p className="text-sm font-bold opacity-70 leading-relaxed">
              이전 달 리포트는 자동으로 생성되지 않아요.<br />
              새로고침 버튼을 눌러 직접 생성할 수 있어요.
            </p>
            <RefreshButton />
          </>
        )}
      </div>
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
    </div>
  );
}

// 월간 리포트 (헤더 카드)
function AiMonthlyReportCard({ onRefresh, refreshing }: { onRefresh: () => void; refreshing: boolean }) {
  const { aiReport, isCurrentMonth } = useDash();

  if (!aiReport?.monthlyReport) return null;

  const report = aiReport.monthlyReport;
  const guardian = aiReport.guardianMessage;
  const next = aiReport.nextSuggestion;

  return (
    <div className="bg-deep-green rounded-[40px] p-8 lg:p-10 text-white relative overflow-hidden">
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-main-yellow fill-main-yellow" />
              <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">AI 월간 리포트</span>
            </div>
            <h3 className="text-xl font-black leading-tight">{report.headline}</h3>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing || (aiReport?.remainingRefreshCount ?? 1) === 0}
            title={`오늘 ${aiReport?.remainingRefreshCount ?? 0}회 남음`}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed relative group"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {(aiReport?.remainingRefreshCount ?? 0) > 0 && !refreshing && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-main-yellow rounded-full text-[9px] font-black text-white flex items-center justify-center">
                {aiReport?.remainingRefreshCount}
              </span>
            )}
          </button>
        </div>

        <p className="text-sm font-bold opacity-80 leading-relaxed">{report.narrative}</p>

        {report.highlights.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">이달의 하이라이트</p>
            {report.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-main-yellow fill-main-yellow mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-black opacity-90">{h.title}</span>
                  {h.reason && <span className="text-xs opacity-60"> · {h.reason}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {(guardian || next) && (
          <div className="space-y-2 pt-4 border-t border-white/10">
            {guardian && (
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                <span className="text-main-yellow font-black">보호자에게 · </span>{guardian}
              </p>
            )}
            {next && (
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                <span className="text-main-green font-black">다음 달 팁 · </span>{next}
              </p>
            )}
          </div>
        )}

        {report.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {report.tags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-white/10 rounded-full text-[11px] font-black opacity-80">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-main-green/10 rounded-full blur-3xl" />
    </div>
  );
}

// 활동 에너지 카드
function AiActivityCard() {
  const { aiReport } = useDash();

  if (!aiReport?.activityInsight) return null;

  const a = aiReport.activityInsight;
  const personality = aiReport.personalityInsight;

  const trendConfig = {
    UP:      { icon: ArrowUp,   color: 'text-main-green', bg: 'bg-surface-green', label: '이전보다 활발해졌어요' },
    STABLE:  { icon: Minus,     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/10',       label: '꾸준하게 유지 중이에요' },
    DOWN:    { icon: ArrowDown, color: 'text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/10',     label: '이전보다 조금 줄었어요' },
    UNKNOWN: { icon: Minus,     color: 'text-gray-400',   bg: 'bg-gray-100 dark:bg-white/5',       label: '비교 데이터가 부족해요' },
  };
  const levelLabel = { GREAT: '활발', NORMAL: '보통', WATCH: '관찰 필요', WARNING: '관찰 필요', UNKNOWN: '-' };
  const levelColor = { GREAT: 'text-main-green bg-surface-green', NORMAL: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
                       WATCH: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10', WARNING: 'text-orange-500 bg-orange-50 dark:bg-orange-900/10', UNKNOWN: 'text-gray-400 bg-gray-100 dark:bg-white/5' };

  const trendCfg = trendConfig[a.trend as keyof typeof trendConfig] ?? trendConfig.UNKNOWN;
  const TrendIcon = trendCfg.icon;
  const hasComparison = a.recentAverage != null && a.previousAverage != null && a.trend !== 'UNKNOWN';

  return (
    <div className="bg-background rounded-[32px] border border-border shadow-sm p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-text-main flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-deep-green" /> 이달의 활동
        </h3>
        {a.level !== 'UNKNOWN' && (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${levelColor[a.level as keyof typeof levelColor]}`}>
            {levelLabel[a.level as keyof typeof levelLabel]}
          </span>
        )}
      </div>

      {/* 성향 뱃지 */}
      {personality && (
        <div className="flex items-center gap-2 p-3 bg-surface-green/50 rounded-2xl">
          <span className="text-sm font-black text-main-green">{personality.label}</span>
          <span className="text-xs text-text-sub font-bold opacity-80">· {personality.message}</span>
        </div>
      )}

      {/* AI 메시지 */}
      <p className="text-sm font-bold text-text-main leading-relaxed">{a.message}</p>

      {/* 수치 비교 - 데이터 있을 때만 */}
      {hasComparison && (
        <div className={`flex items-center gap-3 p-3.5 rounded-2xl ${trendCfg.bg}`}>
          <TrendIcon className={`w-4 h-4 shrink-0 ${trendCfg.color}`} />
          <div>
            <p className={`text-xs font-black ${trendCfg.color}`}>{trendCfg.label}</p>
            <p className="text-[11px] text-text-sub font-bold mt-0.5">
              최근 2주 {a.recentAverage!.toFixed(1)} → 이전 2주 {a.previousAverage!.toFixed(1)}
              {a.confidence === 'LOW' && <span className="opacity-60"> (기록 적음, 참고용)</span>}
            </p>
          </div>
        </div>
      )}

      {/* 에너지 기준 안내 */}
      <p className="text-[10px] text-text-sub font-bold opacity-60">
        * 활동 에너지는 기록 저장 시 AI가 각 모멘트(산책·외출·휴식 등)에 자동 부여하는 활동 강도 점수(1~5)의 평균이에요.
      </p>
    </div>
  );
}

// 장소 흐름 카드
function AiLocationCard() {
  const { aiReport } = useDash();

  if (!aiReport?.locationInsight) return null;

  const loc = aiReport.locationInsight;

  const verdictConfig = {
    VARIED:   { icon: '🗺️', label: '다양한 장소형', desc: '여러 공간에서 다양한 추억을 남겼어요', bg: 'bg-purple-50 dark:bg-purple-900/10', text: 'text-purple-600' },
    FOCUSED:  { icon: '📍', label: '한 장소 집중형', desc: '좋아하는 장소에서 깊이 있는 시간을 보냈어요', bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-600' },
    ROUTINE:  { icon: '🔄', label: '반복 루틴형', desc: '정해진 장소를 꾸준히 방문하는 패턴이 있어요', bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-600' },
    LOW_DATA: { icon: '📝', label: '장소 기록 적음', desc: '장소 기록이 더 쌓이면 패턴을 분석할 수 있어요', bg: 'bg-gray-50 dark:bg-white/5', text: 'text-text-sub' },
  };

  const verdict = verdictConfig[loc.verdict as keyof typeof verdictConfig] ?? verdictConfig.LOW_DATA;

  return (
    <div className="bg-background rounded-[32px] border border-border shadow-sm p-6 lg:p-8 space-y-5 flex-1">
      <h3 className="font-black text-text-main flex items-center gap-2">
        <MapPin className="w-5 h-5 text-main-green" /> 이달의 장소 흐름
      </h3>

      <div className={`flex items-center gap-3 p-4 rounded-2xl ${verdict.bg}`}>
        <span className="text-2xl">{verdict.icon}</span>
        <div>
          <p className={`font-black text-sm ${verdict.text}`}>{verdict.label}</p>
          <p className={`text-xs font-bold ${verdict.text} opacity-70 mt-0.5`}>{verdict.desc}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {loc.verdict !== 'LOW_DATA' && (
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            <div className="p-3 bg-surface-green/50 rounded-xl text-center">
              <p className="text-xl font-black text-main-green">{loc.uniquePlaceCount}곳</p>
              <p className="text-[10px] font-black text-text-sub mt-0.5">방문 장소</p>
            </div>
            <div className="p-3 bg-background border border-border rounded-xl text-center">
              <p className="text-xl font-black text-text-main">{loc.placeRecordCount}일</p>
              <p className="text-[10px] font-black text-text-sub mt-0.5">총 외출</p>
            </div>
          </div>
        )}

        {loc.topPlace && (
          <div className="flex-1 flex items-center gap-2 p-3 bg-surface-green rounded-xl">
            <Zap className="w-4 h-4 text-main-green fill-main-green shrink-0" />
            <div>
              <p className="text-[10px] font-black text-main-green">가장 많이 간 곳</p>
              <p className="text-sm font-black text-text-main truncate">{loc.topPlace}</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm font-bold text-text-sub leading-relaxed">{loc.message}</p>
    </div>
  );
}


// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const dashboard = useDashboard();
  const { aiReport, aiLoading, aiRefreshing, refreshAiReport } = dashboard;
  const [refreshLimitToast, setRefreshLimitToast] = useState(false);

  const handleRefresh = async () => {
    const result = await refreshAiReport();
    if (result === 'limit') {
      setRefreshLimitToast(true);
      setTimeout(() => setRefreshLimitToast(false), 3000);
    }
  };

  return (
    <DashboardCtx.Provider value={dashboard}>
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-y-auto no-scrollbar p-4 lg:p-8">
      {refreshLimitToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl">
          오늘 새로고침 횟수(3회)를 모두 사용했어요
        </div>
      )}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6">

        {/* 1. 상단 레이아웃 (프로필, 활동 요약, 퀵 액션) */}
        <div className="md:col-span-3 lg:col-span-4">
          <PetProfileCard />
        </div>
        <div className="md:col-span-3 lg:col-span-5">
          <ActivityStatsCard />
        </div>
        <div className="md:col-span-6 lg:col-span-3">
          <QuickActionCard />
        </div>

        {/* AI 섹션 타이틀 + 월 네비게이터 */}
        <div className="md:col-span-6 lg:col-span-12">
          <div className="flex items-center justify-between px-1 mt-4">
            <h2 className="text-xl font-black text-text-main flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-main-yellow fill-main-yellow" /> AI 분석
            </h2>
            <MonthNavigator />
          </div>
        </div>

        {aiLoading ? (
          <>
            <div className="md:col-span-6 lg:col-span-12 bg-deep-green rounded-[40px] p-10 space-y-4">
              <Skeleton className="h-6 w-40 bg-white/20" />
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-5/6 bg-white/20" />
              <div className="pt-4 border-t border-white/10">
                <Skeleton className="h-4 w-1/2 bg-white/20" />
              </div>
            </div>
            {/* 좌측 스택 스켈레톤 (Activity + Location) */}
            <div className="md:col-span-7 lg:col-span-8 space-y-4 lg:space-y-6 h-full">
              <div className="bg-background rounded-[32px] border border-border p-8 space-y-4">
                <Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-full" /><Skeleton className="h-10 w-full rounded-2xl" />
              </div>
              <div className="bg-background rounded-[32px] border border-border p-8 space-y-6">
                <Skeleton className="h-6 w-40" /><Skeleton className="h-20 w-full" /><Skeleton className="h-24 w-full" />
              </div>
            </div>
            {/* 우측 사이드바 스켈레톤 (Places + Photos) */}
            <div className="md:col-span-5 lg:col-span-4 space-y-4 lg:space-y-6 h-full">
              <div className="bg-background rounded-[32px] border border-border p-8 space-y-4">
                <Skeleton className="h-5 w-32" /><Skeleton className="h-20 w-full rounded-2xl" />
              </div>
              <div className="space-y-4 flex-1 flex flex-col">
                <Skeleton className="h-5 w-32" />
                <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                  <Skeleton className="aspect-square rounded-2xl" /><Skeleton className="aspect-square rounded-2xl" />
                </div>
              </div>
            </div>
          </>
        ) : !aiReport?.hasData ? (
          <div className="md:col-span-6 lg:col-span-12">
            <AiEmptyState
              onRefresh={handleRefresh}
              refreshing={aiRefreshing}
              remainingRefreshCount={aiReport?.remainingRefreshCount ?? null}
              recordCount={aiReport?.recordCount ?? null}
            />
          </div>
        ) : (
          <>
            {/* AI 리포트 메인 */}
            <div className="md:col-span-6 lg:col-span-12">
              <AiMonthlyReportCard onRefresh={handleRefresh} refreshing={aiRefreshing} />
            </div>

            {/* 좌측 콘텐츠 (활동 + 장소 흐름) */}
            <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-4 lg:gap-6 h-full">
              <AiActivityCard />
              <AiLocationCard />
            </div>

            {/* 우측 사이드바 (자주 가는 곳 + 베스트 포토) */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-4 lg:gap-6 h-full">
              <FavoritePlacesCard />
              <BestPhotosStrip />
            </div>
          </>
        )}
      </div>
    </div>
    </DashboardCtx.Provider>
  );
}
