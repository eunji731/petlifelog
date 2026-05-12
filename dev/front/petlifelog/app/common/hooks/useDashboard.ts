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

export function useDashboard() {
  const { selectedPetId } = usePetStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiRefreshing, setAiRefreshing] = useState(false);

  const petId = selectedPetId === ALL_PETS_ID ? null : selectedPetId;
  const query = petId ? `?petId=${petId}` : '';

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

  const refreshAiReport = async () => {
    setAiRefreshing(true);
    try {
      const res = await clientApi.post(`/api/dashboard/ai-report/refresh${query}`);
      setAiReport(res.data.data);
    } catch (e) {
      console.error('AI 리포트 재생성 실패:', e);
    } finally {
      setAiRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchAiReport();
  }, [fetchSummary, fetchAiReport]);

  return { summary, aiReport, summaryLoading, aiLoading, aiRefreshing, refreshAiReport };
}
