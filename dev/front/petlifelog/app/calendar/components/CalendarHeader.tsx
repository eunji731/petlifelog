'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Bell, Calendar as CalendarIcon, Plus } from 'lucide-react';
import DateDropdown from './DateDropdown';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onGoToDate: (year: number, month: number) => void;
  onRecord: () => void;
}

export default function CalendarHeader({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onToday,
  onGoToDate,
  onRecord
}: CalendarHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const year = currentDate.getFullYear();
  const month = currentDate.toLocaleString('ko-KR', { month: 'long' });

  return (
    <div className="flex items-center justify-between px-2 lg:px-4 py-2 lg:py-4 shrink-0">
      {/* Navigation and Date Display */}
      <div className="flex items-center gap-2 lg:gap-6">
        <div className="flex items-center gap-0.5 lg:gap-2">
          <button 
            onClick={onPrevMonth} 
            className="p-1.5 lg:p-2 hover:bg-main-yellow/10 rounded-xl transition-all text-text-sub hover:text-main-yellow active:scale-90"
          >
            <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 rounded-2xl transition-all group active:scale-95 ${
                isDropdownOpen ? 'bg-main-yellow/10 text-main-yellow' : 'hover:bg-main-yellow/5'
              }`}
            >
              <h2 className={`text-base lg:text-2xl font-black tracking-tight min-w-[90px] lg:min-w-[160px] text-center transition-colors ${
                isDropdownOpen ? 'text-main-yellow' : 'text-text-main group-hover:text-main-yellow'
              }`}>
                {year}년 {month}
              </h2>
              <CalendarIcon className={`w-3.5 h-3.5 transition-all lg:block hidden ${
                isDropdownOpen ? 'text-main-yellow rotate-12 scale-110' : 'text-text-sub group-hover:text-main-yellow opacity-0 group-hover:opacity-100'
              }`} />
            </button>

            {isDropdownOpen && (
              <DateDropdown 
                currentDate={currentDate}
                onSelect={(y, m) => {
                  onGoToDate(y, m);
                  setIsDropdownOpen(false);
                }}
                onClose={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
          
          <button 
            onClick={onNextMonth} 
            className="p-1.5 lg:p-2 hover:bg-main-yellow/10 rounded-xl transition-all text-text-sub hover:text-main-yellow active:scale-90"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {/* Improved Mobile-Friendly Today Button */}
        <button 
          onClick={onToday}
          className="shrink-0 px-3 lg:px-4 py-1.5 lg:py-2 bg-white border border-border rounded-xl text-[11px] lg:text-sm font-black text-text-main hover:bg-main-yellow/5 hover:border-main-yellow/30 transition-all shadow-sm active:scale-95"
        >
          오늘
        </button>
      </div>

      {/* Notifications & Record */}
      <div className="flex items-center gap-2 lg:gap-3">
        <button 
          onClick={onRecord}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-main-yellow text-white font-black rounded-xl text-xs lg:text-sm shadow-md shadow-main-yellow/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">기록하기</span>
        </button>

        <button className="relative p-2 lg:p-2.5 bg-white rounded-xl shadow-sm border border-border text-text-sub hover:text-text-main transition-all group active:scale-90">
          <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="absolute top-1.5 lg:top-2.5 right-1.5 lg:right-2.5 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );
}
