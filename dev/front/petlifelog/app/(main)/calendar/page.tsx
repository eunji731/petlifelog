'use client';

import React, { useState } from 'react';
import CalendarHeader from '@/app/calendar/components/CalendarHeader';
import CalendarGrid from '@/app/calendar/components/CalendarGrid';
import DiaryPreview from '@/app/calendar/components/DiaryPreview';
import DiaryEditor from '@/app/calendar/components/DiaryEditor';
import { useDiary, DailyLog } from '@/app/common/hooks/useDiary';
import { useCalendar } from '@/app/calendar/hooks/useCalendar';

export default function CalendarPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  
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
    setIsEditing(false); // Switch to preview mode on date change
    setShowSidePanel(true); // Show panel on mobile
  };

  const handleSave = (data: DailyLog) => {
    addDailyLog(data);
    setIsEditing(false);
    setShowSidePanel(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowSidePanel(false);
  };

  const handleEditRequest = () => {
    setIsEditing(true);
    setShowSidePanel(true);
  };

  const handleClosePanel = () => {
    setShowSidePanel(false);
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
      <div className="flex-1 flex flex-col min-h-0 bg-white p-2 lg:p-6 overflow-y-auto no-scrollbar">
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
      {/* Desktop: Always visible or conditional? Usually always visible on LG */}
      <div className={`
        ${showSidePanel ? 'fixed inset-0 z-[150] lg:relative lg:inset-auto lg:z-auto lg:flex' : 'hidden lg:flex'}
        w-full lg:w-[400px] xl:w-[480px] shrink-0 border-l border-border bg-white overflow-hidden flex-col
      `}>
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
