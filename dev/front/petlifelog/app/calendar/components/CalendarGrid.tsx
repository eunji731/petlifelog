'use client';

import React from 'react';
import Image from 'next/image';
import { Cake, Syringe, Star } from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  entries: Record<string, any>;
  events: Record<string, any[]>;
}

// Helper to format date to YYYY-MM-DD in local time
const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarGrid({ 
  currentDate, 
  selectedDate, 
  onSelectDate,
  entries,
  events
}: CalendarGridProps) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ day: null, month: 'prev', date: null });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      month: 'current',
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i)
    });
  }

  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: null, month: 'next', date: null });
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const todayKey = formatDateKey(new Date());
  const selectedKey = formatDateKey(selectedDate);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'BIRTHDAY': return <Cake className="w-2.5 h-2.5 text-pink-400" />;
      case 'VACCINE': return <Syringe className="w-2.5 h-2.5 text-blue-400" />;
      default: return <Star className="w-2.5 h-2.5 text-amber-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6 lg:px-10 pb-2 overflow-hidden">
      <div className="grid grid-cols-7 h-8 items-center shrink-0 border-b border-transparent">
        {weekDays.map((day, i) => (
          <div key={day} className={`text-center text-[10px] font-black tracking-widest ${i === 0 ? 'text-red-400/60' : 'text-text-sub/40'}`}>
            {day}
          </div>
        ))}
      </div>
      
      <div 
        className="flex-1 grid grid-cols-7 gap-0 min-h-0 overflow-hidden"
        style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
      >
        {days.map((item, index) => {
          if (!item.date) return <div key={index} className="relative w-full h-full border border-transparent" />;

          const dateKey = formatDateKey(item.date);
          const entry = entries[dateKey];
          const dayEvents = events[dateKey] || [];
          const isSelected = selectedKey === dateKey;
          const isToday = todayKey === dateKey;
          
          return (
            <div key={index} className="relative w-full h-full min-h-0 overflow-hidden">
              <button
                onClick={() => onSelectDate(item.date!)}
                className={`absolute inset-0.5 rounded-2xl transition-all duration-200 overflow-hidden ${
                  isSelected 
                    ? 'bg-main-yellow/10' 
                    : 'hover:bg-main-yellow/5'
                }`}
              >
                <div className={`absolute inset-0 rounded-2xl border-2 pointer-events-none transition-colors duration-200 ${
                  isSelected ? 'border-main-yellow shadow-[inset_0_0_8px_rgba(255,212,90,0.1)]' : 'border-transparent'
                }`} />

                <div className="absolute inset-0 flex flex-col items-center py-1.5 lg:py-2">
                  <span className={`text-xs lg:text-sm font-black leading-none transition-colors duration-200 ${
                    isToday ? 'text-main-green' : (isSelected ? 'text-main-yellow' : 'text-text-main/80')
                  }`}>
                    {item.day}
                  </span>

                  <div className="flex-1 flex items-center justify-center w-full min-h-0">
                    <div className="w-9 h-9 lg:w-11 lg:h-11 shrink-0 flex items-center justify-center">
                      {entry?.photo ? (
                        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm">
                          <Image src={entry.photo} alt="Daily" fill className="object-cover" />
                          {entry.ai_status === 'PROCESSING' && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      ) : (
                        entry?.hasDiary && (
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-main-yellow' : 'bg-main-green/40'}`} />
                        )
                      )}
                    </div>
                  </div>

                  <div className="h-1 flex items-center justify-center shrink-0">
                    {isToday && (
                      <div className="w-1 h-1 rounded-full bg-main-green" />
                    )}
                  </div>
                </div>

                {dayEvents.length > 0 && (
                  <div className="absolute top-1.5 right-1.5">
                    {getEventIcon(dayEvents[0].event_type)}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
