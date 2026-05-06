'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DiaryEntry {
  title: string;
  location: string;
  category: string;
  content: string;
  photos: string[];
  weather?: string;
  ai_status?: 'PROCESSING' | 'DONE';
  energy_level?: number;
  tags?: string[];
  dogs_detected?: string[]; // IDs or names of pets
  dateKey: string; // YYYY-MM-DD
}

interface DiaryState {
  entries: Record<string, DiaryEntry>;
  addEntry: (dateKey: string, entry: Omit<DiaryEntry, 'dateKey'>) => void;
  getEntry: (dateKey: string) => DiaryEntry | undefined;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      entries: {
        '2026-05-17': {
          dateKey: '2026-05-17',
          title: '햇살 가득한 한강 산책!',
          location: '뚝섬한강공원',
          category: 'ACTIVITY',
          content: '오늘은 주말이라 그런지 친구들이 정말 많았어! 바람도 시원하고 기분이 최고야.',
          photos: ['/dog-walk.jpg', '/dog-walk-2.jpg', '/dog-walk-3.jpg', '/dog-walk-4.jpg', '/dog-walk-5.jpg'],
          weather: 'SUNNY',
          ai_status: 'DONE',
          energy_level: 5,
          tags: ['한강공원', '산책', '친구들', '신남'],
          dogs_detected: ['봉봉이']
        },
        '2026-05-18': {
          dateKey: '2026-05-18',
          title: '졸린 오후...',
          location: '우리집 거실',
          category: 'GENERAL',
          content: '산책 다녀와서 그런지 계속 잠이 와. 엄마 옆에서 낮잠 자는 게 제일 좋아.',
          photos: ['/dog-sleep.jpg'],
          weather: 'CLOUDY',
          ai_status: 'PROCESSING',
          energy_level: 1,
          tags: ['낮잠', '집순이', '평온'],
          dogs_detected: ['봉봉이']
        },

        '2026-05-15': {
          dateKey: '2026-05-15',
          title: '새로운 간식 맛보기',
          location: '주방 앞',
          category: 'OBJECT',
          content: '오늘 엄마가 맛있는 오리 안심 간식을 줬어! 냄새부터가 다르더라고.',
          photos: ['/dog-eat.jpg', '/dog-eat-2.jpg'],
          weather: 'SUNNY',
          ai_status: 'DONE',
          energy_level: 3,
          tags: ['간식', '오리안심', '먹방']
        },
        '2026-05-09': {
          dateKey: '2026-05-09',
          title: '공놀이는 멈출 수 없어',
          location: '거실 카페트',
          category: 'ACTIVITY',
          content: '새로 산 노란 공이 너무 맘에 들어. 백 번도 넘게 가져다 줬는데 엄마가 지쳤나 봐.',
          photos: ['/dog-play.jpg', '/dog-play-2.jpg'],
          weather: 'RAINY',
          ai_status: 'DONE',
          energy_level: 4,
          tags: ['장난감', '공놀이', '무한반복']
        },
      },
      addEntry: (dateKey, entry) => {
        set((state) => ({
          entries: {
            ...state.entries,
            [dateKey]: { ...entry, dateKey }
          }
        }));
      },
      getEntry: (dateKey) => get().entries[dateKey],
    }),
    {
      name: 'diary-storage',
    }
  )
);

export const useDiary = () => {
  const { entries, addEntry, getEntry } = useDiaryStore();
  return {
    entries,
    addEntry,
    getEntry,
    allEntries: Object.values(entries).sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
  };
};
