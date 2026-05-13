'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, LayoutGrid, List } from 'lucide-react';
import DateDropdown from './DateDropdown';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onGoToDate: (year: number, month: number) => void;
  onRecord: () => void;
  isTimelineMode: boolean;
  onToggleView: () => void;
}

export default function CalendarHeader({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onToday,
  onGoToDate,
  onRecord,
  isTimelineMode,
  onToggleView
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
              className={`flex items-center gap-1 lg:px-4 py-2 rounded-2xl transition-all group active:scale-95 ${
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

        <div className="flex items-center gap-1 bg-surface-green/20 p-1 rounded-xl">
          <button 
            onClick={onToday}
            className="shrink-0 px-3 lg:px-4 py-1.5 lg:py-2 bg-background border border-border rounded-lg text-[11px] lg:text-sm font-black text-text-main hover:bg-main-yellow/5 hover:border-main-yellow/30 transition-all shadow-sm active:scale-95"
          >
            오늘
          </button>
          
          <button 
            onClick={onToggleView}
            className={`relative group flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-[11px] lg:text-sm font-black transition-all ${
              isTimelineMode 
                ? 'bg-main-green text-white shadow-md' 
                : 'bg-background border border-border text-text-main hover:bg-main-green/5'
            }`}
          >
            {isTimelineMode ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isTimelineMode ? '달력보기' : '모아보기'}</span>
            {!isTimelineMode && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-slate-800 text-white text-[10px] lg:text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] shadow-xl border border-white/10">
                선택하신 해당월의 일기를 모아보기 가능합니다.
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-slate-800"></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Record */}
      <div className="flex items-center gap-2 lg:gap-3">
        <button 
          onClick={onRecord}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-main-yellow text-white font-black rounded-xl text-xs lg:text-sm shadow-md shadow-main-yellow/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">기록하기</span>
        </button>
      </div>
    </div>
  );
}
