'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import CalendarHeader from '@/app/calendar/components/CalendarHeader';
import CalendarGrid from '@/app/calendar/components/CalendarGrid';
import DiaryPreview from '@/app/calendar/components/DiaryPreview';
import DiaryEditor from '@/app/calendar/components/DiaryEditor';
import MonthlyTimeline from '@/app/calendar/components/MonthlyTimeline';
import { useDiary, DailyLog } from '@/app/common/hooks/useDiary';
import { useCalendar } from '@/app/calendar/hooks/useCalendar';

function CalendarContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  // URL에서 초기 날짜 계산 (렌더링 시점에 바로 결정)
  const getInitialDate = () => {
    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const initialDate = getInitialDate();
  
  const [isEditing, setIsEditing] = useState(false);
  // dateParam이 있으면 처음부터 상세 창이 열린 상태로 시작 (단, 전체화면은 부담스러우므로 반반)
  const [showSidePanel, setShowSidePanel] = useState(!!dateParam);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTimelineMode, setIsTimelineMode] = useState(false);
  
  const { addDailyLog } = useDiary();
  const { 
    currentDate, 
    selectedDate,
    onPrevMonth, 
    onNextMonth, 
    onToday, 
    goToDate,
    onSelectDate
  } = useCalendar(initialDate);

  // URL 파라미터가 변경될 때를 위한 처리 (이미 페이지에 있을 때 파라미터만 바뀌는 경우)
  useEffect(() => {
    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      
      if (!isNaN(parsedDate.getTime())) {
        goToDate(parsedDate.getFullYear(), parsedDate.getMonth());
        onSelectDate(parsedDate);
        setIsEditing(false);
        setShowSidePanel(true);
        setIsTimelineMode(false); // 상세 보기 시엔 타임라인 모드 해제
      }
    }
  }, [dateParam, goToDate, onSelectDate]);

  const handleDateSelect = (date: Date) => {
    onSelectDate(date);
    setIsEditing(false);
    setShowSidePanel(true);
    setIsTimelineMode(false); // 날짜 선택 시 타임라인 모드 해제
  };

  const handleSave = (data: DailyLog) => {
    addDailyLog(data);
    setIsEditing(false);
    setShowSidePanel(false);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowSidePanel(false);
    setIsExpanded(false);
  };

  const handleEditRequest = () => {
    setIsEditing(true);
    setShowSidePanel(true);
  };

  const handleClosePanel = () => {
    setShowSidePanel(false);
    setIsExpanded(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleToday = () => {
    onToday();
    setIsEditing(false);
    if (window.innerWidth < 1024) {
      setShowSidePanel(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white relative overflow-hidden">
      <div className="bg-white border-b border-border">
        <div className="max-w-[1600px] mx-auto w-full">
          <CalendarHeader 
            currentDate={currentDate}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            onToday={handleToday}
            onGoToDate={goToDate}
            onRecord={() => {
              setIsEditing(true);
              setShowSidePanel(true);
              setIsTimelineMode(false);
            }}
            isTimelineMode={isTimelineMode}
            onToggleView={() => setIsTimelineMode(!isTimelineMode)}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row relative">
        {isTimelineMode ? (
          <MonthlyTimeline 
            currentDate={currentDate} 
            onDateSelect={handleDateSelect} 
          />
        ) : (
          <>
            {/* Main Calendar Area */}
            <div className={`flex-col min-h-0 bg-white p-2 lg:p-6 overflow-y-auto no-scrollbar transition-all duration-500 ${
              isExpanded ? 'hidden lg:flex lg:w-0 lg:opacity-0 lg:invisible' : 'flex-1 flex lg:w-1/2 lg:flex-none'
            }`}>
              <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                <div className="flex-1 min-h-[400px]">
                  <CalendarGrid 
                    selectedDate={selectedDate} 
                    onDateSelect={handleDateSelect} 
                    currentDate={currentDate}
                  />
                </div>
              </div>
            </div>

            {/* Side Panel: Preview or Editor */}
            <div className={`
              ${showSidePanel ? 'fixed inset-0 z-[150] flex' : 'hidden'} 
              lg:relative lg:inset-auto lg:z-auto lg:flex
              ${isExpanded ? 'lg:flex-1' : 'w-full lg:w-1/2'}
              shrink-0 border-l border-border bg-white overflow-hidden flex-col transition-all duration-500 relative
            `}>
              {/* Expand/Collapse Toggle Button (Desktop Only) */}
              <button 
                onClick={toggleExpand}
                className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-[160] p-2 bg-white border border-border border-l-0 rounded-r-xl shadow-md hover:bg-surface-green transition-all group"
                title={isExpanded ? "달력 보기" : "크게 보기"}
              >
                {isExpanded ? (
                  <ChevronRight className="w-4 h-4 text-text-main group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-text-main group-hover:-translate-x-0.5 transition-transform" />
                )}
              </button>

              {isEditing ? (
                <DiaryEditor 
                  date={selectedDate}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <DiaryPreview 
                  date={selectedDate}
                  onEdit={handleEditRequest}
                  onClose={handleClosePanel}
                  isExpanded={isExpanded}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-white text-sm font-bold text-text-sub">불러오는 중...</div>}>
      <CalendarContent />
    </Suspense>
  );
}
