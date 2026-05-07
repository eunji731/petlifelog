'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePetStore, ALL_PETS_ID } from './usePet';

// 모멘트에 포함된 사진 정보
export interface Photo {
  id: string;
  path: string;
  takenAt?: string;
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
  getDailyLog: (dateKey: string) => DailyLog | undefined;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      dailyLogs: {
        '2026-05-17': {
          id: 'log-1',
          dateKey: '2026-05-17',
          aiTitle: '한강에서 시작해 집에서 끝난 완벽한 하루',
          aiSummary: '오늘은 봉봉이와 함께 한강공원 산책도 하고, 집에서 맛있는 간식을 먹으며 푹 쉬었어요. 전체적으로 에너지가 넘치면서도 평온한 하루였습니다.',
          representativePhotoPath: '/dog-walk.jpg',
          moments: [
            {
              id: 'moment-1',
              category: 'ACTIVITY',
              eventTime: '2026-05-17T10:00:00',
              locationName: '뚝섬한강공원',
              aiTitle: '햇살 가득한 한강 산책!',
              aiContent: '오늘은 주말이라 그런지 친구들이 정말 많았어! 바람도 시원하고 기분이 최고야.',
              energyLevel: 5,
              photos: [{ id: 'p1', path: '/dog-walk.jpg' }],
              tags: ['한강공원', '산책'],
              dogIds: ['봉봉이-id']
            },
            {
              id: 'moment-2',
              category: 'OBJECT',
              eventTime: '2026-05-17T15:00:00',
              locationName: '우리집',
              aiTitle: '산책 후 꿀맛 같은 간식 시간',
              aiContent: '신나게 놀고 와서 먹는 소고기 간식은 정말 꿀맛이야! 엄마가 더 줬으면 좋겠다.',
              energyLevel: 3,
              photos: [{ id: 'p2', path: '/dog-eat.jpg' }],
              tags: ['간식시간', '소고기'],
              dogIds: ['봉봉이-id']
            }
          ]
        }
      },
      addDailyLog: (log) => {
        set((state) => ({
          dailyLogs: {
            ...state.dailyLogs,
            [log.dateKey]: log
          }
        }));
      },
      getDailyLog: (dateKey) => get().dailyLogs[dateKey],
    }),
    {
      name: 'diary-hierarchical-storage',
    }
  )
);

export const useDiary = () => {
  const { dailyLogs, addDailyLog, getDailyLog } = useDiaryStore();
  const { selectedPetId } = usePetStore();

  const allLogs = Object.values(dailyLogs).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  // 필터링된 로그 계산
  const filteredLogs = selectedPetId === ALL_PETS_ID
    ? allLogs
    : allLogs.filter(log => 
        log.moments.some(moment => moment.dogIds.includes(selectedPetId || ''))
      );

  return {
    dailyLogs,
    addDailyLog,
    getDailyLog,
    allLogs: filteredLogs,
  };
};
