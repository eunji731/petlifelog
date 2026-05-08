'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronUp, ChevronDown, X } from 'lucide-react';

interface TimelineDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label: string;
}

type PickerMode = 'day' | 'yearMonth';

export default function TimelineDatePicker({ value, onChange, label }: TimelineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setPickerMode] = useState<PickerMode>('day');
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const years = Array.from({ length: 21 }, (_, i) => 2015 + i); // 2015 to 2035
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const scrollYears = (direction: 'up' | 'down') => {
    if (yearListRef.current) {
      const scrollAmount = 120;
      yearListRef.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Close and Reset on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setPickerMode('day');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll current year into view when entering yearMonth mode
  useEffect(() => {
    if (mode === 'yearMonth' && yearListRef.current) {
      const selectedBtn = yearListRef.current.querySelector('[data-selected="true"]');
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ block: 'center' });
      }
    }
  }, [mode]);

  const generateDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), current: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), current: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), current: false });
    }
    return days;
  };

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDateSelect = (date: Date) => {
    onChange(date.toLocaleDateString('en-CA'));
    setIsOpen(false);
    setPickerMode('day');
  };

  const handleYearSelect = (y: number) => {
    setViewDate(new Date(y, month, 1));
  };

  const handleMonthSelect = (mIdx: number) => {
    setViewDate(new Date(year, mIdx, 1));
    setPickerMode('day');
  };

  const displayDate = value ? new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }) : '날짜 선택';

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
          isOpen 
            ? 'border-main-green bg-main-green/5 ring-4 ring-main-green/10' 
            : 'border-border bg-white hover:border-main-green/30'
        }`}
      >
        <CalendarIcon className={`w-3.5 h-3.5 ${isOpen ? 'text-main-green' : 'text-text-sub'}`} />
        <span className={`text-[11px] lg:text-xs font-black ${isOpen ? 'text-main-green' : 'text-text-main'}`}>
          {value ? displayDate : label}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[100] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-border p-4 w-[300px] animate-in zoom-in-95 duration-200 origin-top-left overflow-hidden">
          {mode === 'day' ? (
            /* Day Selection Mode */
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4 px-1">
                <button 
                  onClick={() => setPickerMode('yearMonth')}
                  className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-main-green/5 transition-colors"
                >
                  <span className="text-sm font-black text-text-main group-hover:text-main-green">{year}년 {month + 1}월</span>
                  <ChevronDown className="w-3 h-3 text-text-sub group-hover:text-main-green transition-transform" />
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-1.5 hover:bg-surface-green rounded-lg transition-colors text-text-sub">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleNextMonth} className="p-1.5 hover:bg-surface-green rounded-lg transition-colors text-text-sub">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <div key={d} className={`text-center text-[10px] font-black py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-text-sub/40'}`}>
                    {d}
                  </div>
                ))}
                {generateDays().map((day, i) => {
                  const dateStr = day.date.toLocaleDateString('en-CA');
                  const isSelected = value === dateStr;
                  const isToday = new Date().toLocaleDateString('en-CA') === dateStr;

                  return (
                    <button
                      key={i}
                      onClick={() => handleDateSelect(day.date)}
                      className={`
                        aspect-square rounded-xl text-[11px] font-bold flex items-center justify-center transition-all
                        ${day.current ? 'text-text-main' : 'text-text-sub/20'}
                        ${isSelected ? 'bg-main-green text-white shadow-lg shadow-main-green/30' : 'hover:bg-main-green/10'}
                        ${isToday && !isSelected ? 'text-main-green ring-2 ring-main-green/20' : ''}
                      `}
                    >
                      {day.date.getDate()}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border flex justify-between items-center px-1">
                 <button 
                   onClick={() => { onChange(''); setIsOpen(false); }}
                   className="text-[10px] font-black text-text-sub/60 hover:text-red-500 transition-colors"
                 >
                   초기화
                 </button>
                 <button 
                   onClick={() => handleDateSelect(new Date())}
                   className="text-[10px] font-black text-main-green hover:underline"
                 >
                   오늘로 이동
                 </button>
              </div>
            </div>
          ) : (
            /* Year/Month Selection Mode (Mirroring Header UI) */
            <div className="flex animate-in slide-in-from-top-2 duration-300 h-[300px]">
              {/* Year List with Arrows */}
              <div className="flex flex-col border-r border-border pr-3">
                <span className="text-[9px] font-black text-text-sub/40 tracking-widest uppercase px-3 mb-1 shrink-0">Year</span>
                <div className="relative flex-1 flex flex-col min-h-0 items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); scrollYears('up'); }} 
                    className="w-full flex justify-center py-1 text-text-sub hover:text-main-yellow active:scale-90 transition-all shrink-0"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  
                  <div 
                    ref={yearListRef} 
                    className="flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar min-w-[80px] py-1 scroll-smooth"
                  >
                    {years.map(y => (
                      <button
                        key={y}
                        data-selected={y === year}
                        onClick={() => handleYearSelect(y)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                          y === year ? 'bg-main-yellow text-white shadow-md shadow-main-yellow/20' : 'text-text-main hover:bg-main-yellow/10'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); scrollYears('down'); }} 
                    className="w-full flex justify-center py-1 text-text-sub hover:text-main-yellow active:scale-90 transition-all shrink-0"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Month Grid */}
              <div className="flex flex-col pl-4 flex-1">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <span className="text-[9px] font-black text-text-sub/40 tracking-widest uppercase px-1">Month</span>
                  <button onClick={() => setPickerMode('day')} className="p-1 hover:bg-surface-green rounded-full">
                    <ChevronUp className="w-3.5 h-3.5 text-text-sub" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-1 pb-2 no-scrollbar">
                  {months.map((m, idx) => {
                    const isSelected = idx === month;
                    return (
                      <button
                        key={m}
                        onClick={() => handleMonthSelect(idx)}
                        className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                          isSelected ? 'bg-main-green text-white shadow-md shadow-main-green/20' : 'text-text-main border border-border/50 hover:bg-main-green/10'
                        }`}
                      >
                        {m}월
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
