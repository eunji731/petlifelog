'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import CalendarHeader from '@/app/calendar/components/CalendarHeader';
import CalendarGrid from '@/app/calendar/components/CalendarGrid';
import DiaryPreview from '@/app/calendar/components/DiaryPreview';
import DiaryEditor from '@/app/calendar/components/DiaryEditor';
import { useCalendar } from '@/app/calendar/hooks/useCalendar';
import { useToast } from '@/app/common/hooks/useToast';
import { useDiary, DiaryEntry } from '@/app/common/hooks/useDiary';
import { useSearchParams } from 'next/navigation';

// Helper to format date to YYYY-MM-DD in local time
const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mockEvents: Record<string, { title: string; event_type: string; memo?: string }[]> = {
  '2026-05-02': [{ title: '봉봉이 생일 🎂', event_type: 'BIRTHDAY', memo: '우리 아이 태어난 지 2년째!' }],
  '2026-05-12': [{ title: '광견병 예방접종', event_type: 'VACCINE', memo: '오전 10시 펫프랜드 동물병원' }],
  '2026-05-17': [{ title: '한강 정기 산책', event_type: 'GENERAL', memo: '동네 친구들과 만나는 날' }],
};

function CalendarContent() {
  const {
    currentDate,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    onToday,
    onSelectDate,
    goToDate,
  } = useCalendar();

  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const { entries, addEntry } = useDiary();
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { success } = useToast();

  // Handle URL date parameter
  const handleUrlDate = useCallback((dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const targetDate = new Date(year, month - 1, day);
      onSelectDate(targetDate);
      goToDate(year, month - 1);
      
      // Delay to avoid synchronous setState during effect
      if (window.innerWidth < 1024) {
        requestAnimationFrame(() => {
          setIsDiaryOpen(true);
        });
      }
    }
  }, [onSelectDate, goToDate]);

  useEffect(() => {
    if (dateParam) {
      handleUrlDate(dateParam);
    }
  }, [dateParam, handleUrlDate]);

  const handleToday = () => {
    onToday();
    setIsEditing(false);
    if (window.innerWidth < 1024) {
      setIsDiaryOpen(true);
    }
  };

  const handleSelectDate = (date: Date) => {
    onSelectDate(date);
    setIsEditing(false);
    if (window.innerWidth < 1024) {
      setIsDiaryOpen(true);
    }
  };

  const handleRecord = () => {
    setIsEditing(true);
    if (window.innerWidth < 1024) {
      setIsDiaryOpen(true);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (window.innerWidth < 1024) {
      setIsDiaryOpen(true);
    }
  };

  const handleSave = (data: Omit<DiaryEntry, 'dateKey'>) => {
    const dateKey = formatDateKey(selectedDate);
    addEntry(dateKey, {
      ...data,
      ai_status: 'DONE',
    });
    
    success('오늘의 추억이 소중히 저장되었습니다! ✨');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Convert entries for CalendarGrid which expects a photo property for thumbnails
  const calendarEntries = Object.entries(entries).reduce((acc, [key, val]) => {
    acc[key] = {
      ...val,
      photo: val.photos?.[0] || '/api/placeholder/400/400'
    };
    return acc;
  }, {} as Record<string, DiaryEntry & { photo: string }>);

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedEntry = entries[selectedDateKey];
  const selectedEvents = mockEvents[selectedDateKey] || [];

  return (
    <div className="flex flex-1 h-screen overflow-hidden flex-col md:flex-row">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-border">
        <CalendarHeader 
          currentDate={currentDate} 
          onPrevMonth={onPrevMonth} 
          onNextMonth={onNextMonth} 
          onToday={handleToday} 
          onGoToDate={goToDate}
          onRecord={handleRecord}
        />
        <div className="flex-1 flex flex-col min-h-0">
          <CalendarGrid 
            currentDate={currentDate} 
            selectedDate={selectedDate} 
            onSelectDate={handleSelectDate}
            entries={calendarEntries}
            events={mockEvents}
          />
        </div>
      </div>

      {/* Desktop Panel */}
      <div className="hidden lg:flex flex-col w-[420px] bg-white overflow-hidden min-h-0 max-h-full shadow-[-8px_0_24px_rgba(0,0,0,0.02)]">
        {isEditing ? (
          <DiaryEditor 
            date={selectedDate}
            initialData={selectedEntry}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <DiaryPreview 
            date={selectedDate} 
            entry={selectedEntry} 
            events={selectedEvents} 
            onRecord={handleRecord}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Mobile Drawer */}
      {isDiaryOpen && (
        <div className="lg:hidden">
          {isEditing ? (
            <DiaryEditor 
              date={selectedDate}
              initialData={selectedEntry}
              onSave={handleSave}
              onCancel={handleCancel}
              isMobile
            />
          ) : (
            <DiaryPreview 
              date={selectedDate} 
              entry={selectedEntry} 
              events={selectedEvents} 
              isMobileDrawer 
              onClose={() => setIsDiaryOpen(false)}
              onRecord={handleRecord}
              onEdit={handleEdit}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-white animate-pulse" />}>
      <CalendarContent />
    </Suspense>
  );
}
