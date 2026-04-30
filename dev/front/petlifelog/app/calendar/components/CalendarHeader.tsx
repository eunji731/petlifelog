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
    <div className="flex items-center justify-between px-6 py-4 lg:px-10 lg:py-6">
      <div className="flex items-center gap-4 lg:gap-6">
        <h2 className="text-xl lg:text-2xl font-black text-text-main tracking-tight">
          {year}년 {month}
        </h2>
        <div className="flex items-center bg-white rounded-xl shadow-sm border border-border p-0.5 lg:p-1">
          <button onClick={onPrevMonth} className="p-1.5 lg:p-1.5 hover:bg-background rounded-lg transition-all text-text-sub hover:text-text-main">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={onToday}
            className="px-2 lg:px-3 py-1 text-[10px] lg:text-xs font-bold text-text-main hover:bg-background rounded-lg transition-all"
          >
            오늘
          </button>
          <button onClick={onNextMonth} className="p-1.5 lg:p-1.5 hover:bg-background rounded-lg transition-all text-text-sub hover:text-text-main">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 lg:p-2.5 bg-white rounded-xl shadow-sm border border-border text-text-sub hover:text-text-main transition-all group">
          <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="absolute top-2 lg:top-2.5 right-2 lg:right-2.5 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );
}
