'use client';

import React, { useState } from 'react';
import CalendarHeader from '@/app/calendar/components/CalendarHeader';
import CalendarGrid from '@/app/calendar/components/CalendarGrid';
import DiaryPreview from '@/app/calendar/components/DiaryPreview';
import { useCalendar } from '@/app/calendar/hooks/useCalendar';

// Mock data based on DDL v3 and Onepager v2
const mockEntries: Record<string, any> = {
  '2026-05-17': {
    photo: '/dog-walk.jpg',
    ai_status: 'DONE',
    title: '햇살 가득한 한강 산책!',
    location: '뚝섬한강공원',
    category: 'ACTIVITY',
    content: '오늘은 주말이라 그런지 친구들이 정말 많았어! 바람도 시원하고 기분이 최고야.',
    photos: ['/dog-walk.jpg', '/dog-walk-2.jpg', '/dog-walk-3.jpg', '/dog-walk-4.jpg', '/dog-walk-5.jpg'],
    weather: 'SUNNY',
    energy_level: 5,
    tags: ['한강공원', '산책', '친구들', '신남']
  },
  '2026-05-18': {
    photo: '/dog-sleep.jpg',
    ai_status: 'PROCESSING',
    title: '졸린 오후...',
    location: '우리집 거실',
    category: 'GENERAL',
    content: '산책 다녀와서 그런지 계속 잠이 와. 엄마 옆에서 낮잠 자는 게 제일 좋아.',
    photos: ['/dog-sleep.jpg'],
    weather: 'CLOUDY',
    energy_level: 1,
    tags: ['낮잠', '집순이', '평온']
  },
  '2026-05-15': {
    photo: '/dog-eat.jpg',
    ai_status: 'DONE',
    title: '새로운 간식 맛보기',
    location: '주방 앞',
    category: 'OBJECT',
    content: '오늘 엄마가 맛있는 오리 안심 간식을 줬어! 냄새부터가 다르더라고.',
    photos: ['/dog-eat.jpg', '/dog-eat-2.jpg'],
    weather: 'SUNNY',
    energy_level: 3,
    tags: ['간식', '오리안심', '먹방']
  },
  '2026-05-09': {
    photo: '/dog-play.jpg',
    ai_status: 'DONE',
    title: '공놀이는 멈출 수 없어',
    location: '거실 카페트',
    category: 'ACTIVITY',
    content: '새로 산 노란 공이 너무 맘에 들어. 백 번도 넘게 가져다 줬는데 엄마가 지쳤나 봐.',
    photos: ['/dog-play.jpg', '/dog-play-2.jpg'],
    weather: 'RAINY',
    energy_level: 4,
    tags: ['장난감', '공놀이', '무한반복']
  },
};

const mockEvents: Record<string, any[]> = {
  '2026-05-02': [{ title: '봉봉이 생일 🎂', event_type: 'BIRTHDAY', memo: '우리 아이 태어난 지 2년째!' }],
  '2026-05-12': [{ title: '광견병 예방접종', event_type: 'VACCINE', memo: '오전 10시 펫프랜드 동물병원' }],
  '2026-05-17': [{ title: '한강 정기 산책', event_type: 'GENERAL', memo: '동네 친구들과 만나는 날' }],
};

export default function CalendarPage() {
  const {
    currentDate,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    onToday,
    onSelectDate,
  } = useCalendar();

  const [isDiaryOpen, setIsDiaryOpen] = useState(false);

  const handleSelectDate = (date: Date) => {
    onSelectDate(date);
    // On mobile, open the diary preview automatically when a date is selected
    if (window.innerWidth < 1024) {
      setIsDiaryOpen(true);
    }
  };

  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedEntry = mockEntries[selectedDateKey];
  const selectedEvents = mockEvents[selectedDateKey] || [];

  return (
    <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        <CalendarHeader 
          currentDate={currentDate} 
          onPrevMonth={onPrevMonth} 
          onNextMonth={onNextMonth} 
          onToday={onToday} 
        />
        <div className="flex-1 flex flex-col min-h-0">
          <CalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            entries={mockEntries}
            events={mockEvents}
          />
        </div>
      </div>

      {/* Desktop Preview */}
      <DiaryPreview 
        date={selectedDate} 
        entry={selectedEntry} 
        events={selectedEvents} 
      />

      {/* Mobile Preview Drawer */}
      {isDiaryOpen && (
        <DiaryPreview 
          date={selectedDate} 
          entry={selectedEntry} 
          events={selectedEvents} 
          isMobileDrawer 
          onClose={() => setIsDiaryOpen(false)}
        />
      )}
    </div>
  );
}
