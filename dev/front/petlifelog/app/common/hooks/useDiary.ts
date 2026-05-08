'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePetStore, ALL_PETS_ID } from './usePet';
import clientApi from '@/app/common/lib/clientApi';

// 모멘트에 포함된 사진 정보
export interface Photo {
  id: string;
  path: string;
  takenAt?: string;
  lat?: number;
  lng?: number;
}

// 개별 사건 (Moment) 정보
export interface Moment {
  id: string;
  category: 'ACTIVITY' | 'GENERAL' | 'OBJECT' | 'HEALTH';
  eventTime?: string;
  locationName?: string;
  aiTitle: string;
  aiContent: string;
  energyLevel: number;
  photos: Photo[];
  tags: string[];
  dogIds: string[];
}

// 하루 총괄 일기 (Daily Log) 정보
export interface DailyLog {
  id: string;
  dateKey: string; // YYYY-MM-DD
  aiTitle: string;
  aiSummary: string;
  representativePhotoPath?: string;
  moments: Moment[];
}

interface DiaryState {
  dailyLogs: Record<string, DailyLog>;
  addDailyLog: (log: DailyLog) => void;
  removeDailyLog: (dateKey: string) => void;
  getDailyLog: (dateKey: string) => DailyLog | undefined;
  setDailyLogs: (logs: Record<string, DailyLog>) => void;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      dailyLogs: {},
      addDailyLog: (log) => {
        set((state) => ({
          dailyLogs: { ...state.dailyLogs, [log.dateKey]: log }
        }));
      },
      removeDailyLog: (dateKey) => {
        set((state) => {
          const newLogs = { ...state.dailyLogs };
          delete newLogs[dateKey];
          return { dailyLogs: newLogs };
        });
      },
      getDailyLog: (dateKey) => get().dailyLogs[dateKey],
      setDailyLogs: (logs) => set({ dailyLogs: logs }),
    }),
    {
      name: 'diary-hierarchical-storage',
    }
  )
);

interface MemoryApiItem {
  id: string;
  dateKey: string;
  aiTitle: string;
  aiSummary: string;
  representativePhotoPath?: string;
  aiDiary?: string;
  locationName?: string;
  energyLevel?: number;
  photos: { id: string; path: string }[];
  petIds: string[];
}

export const useDiary = () => {
  const { dailyLogs, addDailyLog, removeDailyLog, getDailyLog, setDailyLogs } = useDiaryStore();
  const { selectedPetId } = usePetStore();

  const allLogs = Object.values(dailyLogs).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  const filteredLogs = selectedPetId === ALL_PETS_ID
    ? allLogs
    : allLogs.filter(log =>
        log.moments.some(moment => moment.dogIds.includes(selectedPetId || ''))
      );

  const syncFromBackend = async () => {
    try {
      const res = await clientApi.get('/api/memories');
      const memories: MemoryApiItem[] = res.data?.data ?? [];

      const logs: Record<string, DailyLog> = {};
      for (const m of memories) {
        logs[m.dateKey] = {
          id: m.id,
          dateKey: m.dateKey,
          aiTitle: m.aiTitle || '기록',
          aiSummary: m.aiSummary || '',
          representativePhotoPath: m.representativePhotoPath || undefined,
          moments: [{
            id: `m-${m.id}`,
            category: 'GENERAL',
            locationName: m.locationName || '알 수 없는 곳',
            aiTitle: m.aiTitle || '기록',
            aiContent: m.aiDiary || '',
            energyLevel: m.energyLevel || 3,
            photos: (m.photos || []).map(p => ({ id: p.id, path: p.path })),
            tags: [],
            dogIds: m.petIds || [],
          }],
        };
      }
      setDailyLogs(logs);
    } catch (e) {
      console.error('일기 동기화 실패:', e);
    }
  };

  return {
    dailyLogs,
    addDailyLog,
    removeDailyLog,
    getDailyLog,
    allLogs: filteredLogs,
    syncFromBackend,
  };
};
