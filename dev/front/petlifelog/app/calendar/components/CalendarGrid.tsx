'use client';

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Sparkles, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useCalendar } from '../hooks/useCalendar';
import { useDiary } from '@/app/common/hooks/useDiary';
import { usePet, ALL_PETS_ID } from '@/app/common/hooks/usePet';
import { getImagePath } from '@/app/common/lib/clientApi';

export default function CalendarGrid({ 
  onDateSelect, 
  selectedDate,
  currentDate
}: { 
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  currentDate: Date;
}) {
  const { dailyLogs } = useDiary();
  const { selectedPetId } = usePet();

  // Helper to generate days for the current month view
  const generateDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Previous month days
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const days = generateDays();

  const getDayContent = (date: Date) => {
    const dateKey = date.toLocaleDateString('en-CA');
    const logs = dailyLogs[dateKey] || [];
    
    // 필터링된 결과 확인
    if (selectedPetId !== ALL_PETS_ID) {
      return logs.filter(log => log.moments.some(m => m.dogIds.includes(selectedPetId || '')));
    }
    
    return logs;
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-xl lg:rounded-2xl shadow-sm overflow-hidden border border-border">
      <div className="flex-1 grid grid-cols-7 grid-rows-[auto_repeat(6,1fr)] min-h-0">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <div key={day} className={`py-3 text-center text-[10px] font-black uppercase tracking-widest bg-background border-b border-border ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-text-sub/60'}`}>
            {day}
          </div>
        ))}
        
        {days.map((day, i) => {
          const logs = getDayContent(day.date);
          const hasLogs = logs.length > 0;
          const isSelected = selectedDate.toDateString() === day.date.toDateString();
          const isToday = new Date().toDateString() === day.date.toDateString();

          return (
            <div 
              key={i}
              className={`relative flex flex-col items-center justify-start p-1 lg:p-2 transition-all group cursor-pointer border-b border-r border-border last:border-r-0 ${
                day.isCurrentMonth ? 'bg-background' : 'bg-surface-green/5'
              } ${isSelected ? 'bg-main-green/5' : 'hover:bg-surface-green/20'}`}
              onClick={() => onDateSelect(day.date)}
            >
              {/* Selection Border - Inset to never overflow */}
              {isSelected && (
                <div className="absolute inset-0 border-2 border-main-green/30 pointer-events-none" />
              )}

              {/* Date Number */}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <span className={`text-[11px] lg:text-sm font-black transition-all ${
                  isToday ? 'text-main-green' : 
                  isSelected ? 'text-main-green' : 
                  day.isCurrentMonth ? 'text-text-main' : 'text-text-sub/30'
                }`}>
                  {day.date.getDate()}
                </span>
                {isToday && <div className="w-1 h-1 rounded-full bg-main-green" />}
              </div>

              {/* Log Indicator - Stacked Thumbnails */}
              <div className="mt-auto mb-1 lg:mb-2 flex flex-col items-center">
                {hasLogs ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="relative flex items-center justify-center h-6 lg:h-10">
                      {logs.slice(0, 3).reverse().map((log, idx, arr) => (
                        <div 
                          key={log.id} 
                          className="relative w-6 h-6 lg:w-10 lg:h-10 rounded-full overflow-hidden border-2 border-background shadow-sm ring-1 ring-main-green/20"
                          style={{
                            marginLeft: idx === 0 ? 0 : '-12px',
                            zIndex: idx
                          }}
                        >
                          <Image
                            src={getImagePath(log.representativePhotoPath)}
                            alt="Log"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {logs.length > 3 && (
                        <div className="absolute -right-2 -top-1 bg-main-green text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-background z-10">
                          +{logs.length - 3}
                        </div>
                      )}
                    </div>
                    {/* Count Dots for all logs */}
                    <div className="flex gap-0.5 mt-1">
                      {logs.map((log) => (
                        <div key={log.id} className="w-1 h-1 rounded-full bg-main-green/60" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-6 lg:h-10 w-1 bg-transparent" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
