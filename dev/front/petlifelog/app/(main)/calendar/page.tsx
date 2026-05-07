'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarHeader from '@/app/calendar/components/CalendarHeader';
import CalendarGrid from '@/app/calendar/components/CalendarGrid';
import DiaryPreview from '@/app/calendar/components/DiaryPreview';
import DiaryEditor from '@/app/calendar/components/DiaryEditor';
import { useDiary, DailyLog } from '@/app/common/hooks/useDiary';
import { useCalendar } from '@/app/calendar/hooks/useCalendar';

export default function CalendarPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Expansion state
  
  const { addDailyLog } = useDiary();
  const { 
    currentDate, 
    selectedDate,
    onPrevMonth, 
    onNextMonth, 
    onToday, 
    goToDate,
    onSelectDate
  } = useCalendar();

  const handleDateSelect = (date: Date) => {
    onSelectDate(date);
    setIsEditing(false);
    setShowSidePanel(true);
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
    <div className="flex-1 flex overflow-hidden flex-col lg:flex-row relative">
      {/* Main Calendar Area */}
      <div className={`flex-col min-h-0 bg-white p-2 lg:p-6 overflow-y-auto no-scrollbar transition-all duration-500 ${
        isExpanded ? 'hidden lg:flex lg:w-0 lg:opacity-0 lg:invisible' : 'flex-1 flex'
      }`}>
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-2 lg:gap-4">
          <CalendarHeader 
            currentDate={currentDate}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            onToday={handleToday}
            onGoToDate={goToDate}
            onRecord={() => {
              setIsEditing(true);
              setShowSidePanel(true);
            }}
          />
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
        ${showSidePanel ? 'fixed inset-0 z-[150] lg:relative lg:inset-auto lg:z-auto lg:flex' : 'hidden lg:flex'}
        ${isExpanded ? 'lg:flex-1' : 'w-full lg:w-[450px] xl:w-[520px]'}
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
          />
        )}
      </div>
    </div>
  );
}
