'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface DateDropdownProps {
  currentDate: Date;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
  align?: 'left' | 'right';
}

export default function DateDropdown({ currentDate, onSelect, onClose, align = 'left' }: DateDropdownProps) {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const years = Array.from({ length: 21 }, (_, i) => 2015 + i); // 2015 to 2035
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopYearListRef = useRef<HTMLDivElement>(null);
  const mobileYearListRef = useRef<HTMLDivElement>(null);

  // Close on outside click (Desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth >= 1024) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          onClose();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Unified scroll logic for both desktop and mobile refs
  const scrollYears = (direction: 'up' | 'down', isMobile: boolean) => {
    const ref = isMobile ? mobileYearListRef : desktopYearListRef;
    if (ref.current) {
      const scrollAmount = isMobile ? 160 : 120;
      ref.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Scroll current year into view on mount
  useEffect(() => {
    const scrollIntoView = (ref: React.RefObject<HTMLDivElement | null>) => {
      if (ref.current) {
        const selectedYearBtn = ref.current.querySelector('[data-selected="true"]');
        if (selectedYearBtn) {
          selectedYearBtn.scrollIntoView({ block: 'center' });
        }
      }
    };
    scrollIntoView(desktopYearListRef);
    scrollIntoView(mobileYearListRef);
  }, []);

  return (
    <>
      {/* MOBILE VERSION */}
      <div className="lg:hidden fixed inset-0 z-[250] flex flex-col items-center justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full bg-background rounded-t-[40px] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[85vh]">
          <div className="p-6 flex items-center justify-between border-b border-border shrink-0">
            <h3 className="text-lg font-black text-text-main">날짜 선택</h3>
            <button onClick={onClose} className="p-2 bg-background rounded-full active:scale-90 transition-transform">
              <X className="w-5 h-5 text-text-main" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex p-4 gap-4 min-h-0">
            {/* Mobile Year List with functional arrows */}
            <div className="flex-1 flex flex-col min-h-0">
              <span className="text-[10px] font-black text-text-sub/50 tracking-widest uppercase text-center mb-2 shrink-0">Year</span>
              <div className="relative flex-1 flex flex-col min-h-0">
                <button 
                  onPointerDown={(e) => { e.preventDefault(); scrollYears('up', true); }}
                  className="flex justify-center py-3 text-text-sub active:text-main-yellow active:scale-125 transition-all shrink-0"
                >
                  <ChevronUp className="w-6 h-6" />
                </button>
                
                <div 
                  ref={mobileYearListRef} 
                  className="flex-1 overflow-y-auto no-scrollbar py-2 space-y-2 scroll-smooth"
                >
                  {years.map(year => (
                    <button
                      key={year}
                      data-selected={year === selectedYear}
                      onClick={() => setSelectedYear(year)}
                      className={`w-full py-4 rounded-2xl text-base font-black transition-all ${
                        year === selectedYear ? 'bg-main-yellow text-white shadow-lg shadow-main-yellow/20' : 'text-text-main hover:bg-main-yellow/5'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>

                <button 
                  onPointerDown={(e) => { e.preventDefault(); scrollYears('down', true); }}
                  className="flex justify-center py-3 text-text-sub active:text-main-yellow active:scale-125 transition-all shrink-0"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Mobile Month Grid */}
            <div className="flex-[1.5] flex flex-col min-h-0">
              <span className="text-[10px] font-black text-text-sub/50 tracking-widest uppercase text-center mb-2 shrink-0">Month</span>
              <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 pb-4">
                {months.map((month, index) => {
                  const isSelected = index === currentDate.getMonth() && selectedYear === currentDate.getFullYear();
                  return (
                    <button
                      key={month}
                      onClick={() => {
                        onSelect(selectedYear, index);
                        onClose();
                      }}
                      className={`py-4 rounded-2xl text-base font-black transition-all ${
                        isSelected ? 'bg-main-green text-white shadow-lg shadow-main-green/20' : 'text-text-main border border-border bg-background active:bg-main-green/5'
                      }`}
                    >
                      {month}월
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP VERSION */}
      <div 
        ref={containerRef}
        className={`hidden lg:flex absolute top-full mt-2 bg-background shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[32px] border border-border p-4 z-[200] animate-in zoom-in-95 duration-200 ${
          align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
        }`}
      >
        <div className="flex flex-col border-r border-border pr-3">
          <span className="text-[10px] font-black text-text-sub/50 tracking-widest uppercase px-3 mb-2">Year</span>
          <div className="relative flex flex-col items-center">
            <button onClick={(e) => { e.stopPropagation(); scrollYears('up', false); }} className="w-full flex justify-center py-1 text-text-sub hover:text-main-yellow active:scale-90 transition-transform"><ChevronUp className="w-5 h-5" /></button>
            <div ref={desktopYearListRef} className="flex flex-col gap-1 overflow-y-auto h-[220px] no-scrollbar min-w-[100px] py-1 scroll-smooth">
              {years.map(year => (
                <button
                  key={year}
                  data-selected={year === selectedYear}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                    year === selectedYear ? 'bg-main-yellow text-white shadow-md shadow-main-yellow/20' : 'text-text-main hover:bg-main-yellow/10'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            <button onClick={(e) => { e.stopPropagation(); scrollYears('down', false); }} className="w-full flex justify-center py-1 text-text-sub hover:text-main-yellow active:scale-90 transition-transform"><ChevronDown className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex flex-col pl-4 min-w-[200px]">
          <span className="text-[10px] font-black text-text-sub/50 tracking-widest uppercase px-2 mb-2">Month</span>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => {
              const isSelected = index === currentDate.getMonth() && selectedYear === currentDate.getFullYear();
              return (
                <button
                  key={month}
                  onClick={() => { onSelect(selectedYear, index); onClose(); }}
                  className={`py-3 rounded-xl text-sm font-black transition-all ${
                    isSelected ? 'bg-main-green text-white shadow-md shadow-main-green/20' : 'text-text-main hover:bg-main-green/10'
                  }`}
                >
                  {month}월
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
