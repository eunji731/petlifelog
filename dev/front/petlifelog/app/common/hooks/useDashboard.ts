'use client';

import { useState, useEffect, useCallback } from 'react';
import clientApi from '../lib/clientApi';
import { usePetStore, ALL_PETS_ID } from './usePet';

export interface DashboardPetInfo {
  id: string;
  name: string;
  breed: string;
  ageLabel: string;
  daysTogether: number | null;
  birthdayDday: number | null;
  profileImagePath: string | null;
}

export interface MonthlyStats {
  recordedDays: number;
  visitedPlaces: number;
  bestPhotosCount: number;
}

export interface BestPhotoItem {
  photoPath: string;
  memoryId: string;
  memoryDate: string;
  vibeScore: number;
  aiComment: string | null;
}

export interface FavoritePlaceItem {
  locationName: string;
  count: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export interface DashboardSummary {
  pet: DashboardPetInfo | null;
  monthlyStats: MonthlyStats;
  bestPhotos: BestPhotoItem[];
  favoritePlaces: FavoritePlaceItem[];
  streak: StreakInfo;
}

export interface HighlightItem {
  title: string;
  date: string;
  reason: string;
}

export interface AiReport {
  reportYearMonth: string;
  generatedAt: string | null;
  hasData: boolean;
  recordCount: number | null;
  remainingRefreshCount: number | null;
  monthlyReport: {
    headline: string;
    narrative: string;
    highlights: HighlightItem[];
    tags: string[];
  } | null;
  personalityInsight: {
    type: string;
    label: string;
    message: string;
  } | null;
  activityInsight: {
    averageEnergy: number | null;
    recentAverage: number | null;
    previousAverage: number | null;
    diff: number | null;
    trend: 'UP' | 'STABLE' | 'DOWN' | 'UNKNOWN';
    level: 'GREAT' | 'NORMAL' | 'WATCH' | 'WARNING' | 'UNKNOWN';
    confidence: 'HIGH' | 'LOW' | 'NONE';
    message: string;
  } | null;
  locationInsight: {
    verdict: 'VARIED' | 'FOCUSED' | 'ROUTINE' | 'LOW_DATA';
    placeRecordCount: number;
    uniquePlaceCount: number;
    topPlace: string | null;
    message: string;
  } | null;
  guardianMessage: string | null;
  nextSuggestion: string | null;
}

function buildQuery(petId: string | null, year: number, month: number): string {
  const params = new URLSearchParams();
  if (petId) params.set('petId', petId);
  params.set('year', String(year));
  params.set('month', String(month));
  return `?${params.toString()}`;
}

export function useDashboard() {
  const { selectedPetId } = usePetStore();
  const petId = selectedPetId === ALL_PETS_ID ? null : selectedPetId;

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiRefreshing, setAiRefreshing] = useState(false);

  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const goToPrevMonth = useCallback(() => {
    setSelectedMonth(m => {
      if (m === 1) { setSelectedYear(y => y - 1); return 12; }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    setSelectedMonth(m => {
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? selectedYear + 1 : selectedYear;
      if (nextY > curYear || (nextY === curYear && nextM > curMonth)) return m;
      if (m === 12) setSelectedYear(y => y + 1);
      return nextM;
    });
  }, [selectedYear, now]);

  const goToDate = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month + 1); // 0-indexed month from DateDropdown
  }, []);

  const query = buildQuery(petId, selectedYear, selectedMonth);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await clientApi.get(`/api/dashboard/summary${query}`);
      setSummary(res.data.data);
    } catch (e) {
      console.error('대시보드 요약 로드 실패:', e);
    } finally {
      setSummaryLoading(false);
    }
  }, [query]);

  const fetchAiReport = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await clientApi.get(`/api/dashboard/ai-report${query}`);
      setAiReport(res.data.data);
    } catch (e) {
      console.error('AI 리포트 로드 실패:', e);
    } finally {
      setAiLoading(false);
    }
  }, [query]);

  const refreshAiReport = async (): Promise<'ok' | 'limit'> => {
    setAiRefreshing(true);
    try {
      const res = await clientApi.post(`/api/dashboard/ai-report/refresh${query}`);
      setAiReport(res.data.data);
      return 'ok';
    } catch (e: any) {
      if (e?.response?.data?.errorCode === 'AI_DASHBOARD_REFRESH_LIMIT_EXCEEDED') {
        return 'limit';
      }
      console.error('AI 리포트 재생성 실패:', e);
      return 'ok';
    } finally {
      setAiRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchAiReport();
  }, [fetchSummary, fetchAiReport]);

  return {
    summary,
    aiReport,
    summaryLoading,
    aiLoading,
    aiRefreshing,
    refreshAiReport,
    selectedYear,
    selectedMonth,
    isCurrentMonth,
    goToPrevMonth,
    goToNextMonth,
    goToDate,
  };
}
