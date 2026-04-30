'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export default function CalendarHeader({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onToday 
}: CalendarHeaderProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.toLocaleString('ko-KR', { month: 'long' });

  return (
    <div className="flex items-center justify-between px-6 py-4 lg:px-10 lg:py-6 shrink-0">
      {/* Navigation and Date Display */}
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <button 
            onClick={onPrevMonth} 
            className="p-2 hover:bg-main-yellow/10 rounded-xl transition-all text-text-sub hover:text-main-yellow active:scale-90"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
          
          <h2 className="text-xl lg:text-2xl font-black text-text-main tracking-tight min-w-[120px] lg:min-w-[160px] text-center">
            {year}년 {month}
          </h2>
          
          <button 
            onClick={onNextMonth} 
            className="p-2 hover:bg-main-yellow/10 rounded-xl transition-all text-text-sub hover:text-main-yellow active:scale-90"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {/* Separated Today Button */}
        <button 
          onClick={onToday}
          className="px-4 py-2 bg-white border border-border rounded-xl text-xs lg:text-sm font-bold text-text-main hover:bg-main-yellow/5 hover:border-main-yellow/30 transition-all shadow-sm active:scale-95"
        >
          오늘
        </button>
      </div>

      {/* Notifications */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 lg:p-2.5 bg-white rounded-xl shadow-sm border border-border text-text-sub hover:text-text-main transition-all group active:scale-90">
          <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="absolute top-2 lg:top-2.5 right-2 lg:right-2.5 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );
}
