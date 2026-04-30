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

export default function CalendarGrid({
  currentDate,
  selectedDate,
  onSelectDate,
  entries,
  events,
}: CalendarGridProps) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days: { day: number | null; date: Date | null }[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ day: null, date: null });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i) });
  }
  while (days.length < 42) {
    days.push({ day: null, date: null });
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const todayKey = new Date().toISOString().split('T')[0];
  const selectedKey = selectedDate.toISOString().split('T')[0];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'BIRTHDAY': return <Cake className="w-2.5 h-2.5 text-pink-400" />;
      case 'VACCINE':  return <Syringe className="w-2.5 h-2.5 text-blue-400" />;
      default:         return <Star className="w-2.5 h-2.5 text-amber-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 px-8 lg:px-12 pb-4 overflow-hidden">

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 h-6 mb-2 shrink-0">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={`text-center text-[10px] font-bold tracking-widest ${
              i === 0 ? 'text-red-400/60' : 'text-text-sub/40'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/*
        핵심 설계:
        - 그리드 셀 크기는 grid-template-rows: repeat(6, 1fr) 가 결정
        - 각 셀 내부 버튼은 absolute 로 배치 → 콘텐츠가 아무리 달라져도 셀 크기에 영향 없음
        - overflow-hidden + min-h-0 으로 그리드 자체 팽창 차단
      */}
      <div
        className="flex-1 min-h-0 overflow-hidden grid grid-cols-7 gap-px"
        style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}
      >
        {days.map((item, index) => {
          // 빈 셀
          if (!item.date) return <div key={index} />;

          const dateKey = item.date.toISOString().split('T')[0];
          const entry    = entries[dateKey];
          const dayEvents = events[dateKey] || [];
          const isSelected = selectedKey === dateKey;
          const isToday    = todayKey === dateKey;

          return (
            /* 셀: position 기준, 크기는 그리드가 결정 */
            <div key={index} className="relative overflow-hidden">

              {/*
                버튼: absolute inset 으로 셀을 채움
                → 버튼 내부 콘텐츠 크기와 무관하게 셀 크기가 변하지 않음
              */}
              <button
                onClick={() => onSelectDate(item.date!)}
                className={`absolute inset-0.5 rounded-2xl overflow-hidden transition-all duration-200 ${
                  isSelected ? 'bg-main-yellow/10' : 'hover:bg-main-yellow/5'
                }`}
              >
                {/* 선택 테두리 */}
                <div
                  className={`absolute inset-0 rounded-2xl border-2 pointer-events-none transition-colors duration-200 ${
                    isSelected ? 'border-main-yellow' : 'border-transparent'
                  }`}
                />

                {/* 콘텐츠 레이어: 버튼 영역 전체를 absolute 로 채움 */}
                <div className="absolute inset-0 flex flex-col items-center py-1.5 lg:py-2">

                  {/* 날짜 숫자 */}
                  <span
                    className={`shrink-0 text-sm lg:text-base font-black leading-none transition-colors duration-200 ${
                      isToday
                        ? 'text-main-green'
                        : isSelected
                        ? 'text-main-yellow'
                        : 'text-text-main/80'
                    }`}
                  >
                    {item.day}
                  </span>

                  {/* 중앙 영역: flex-1 로 남은 공간 차지, 사진·점 표시 */}
                  <div className="flex-1 min-h-0 flex items-center justify-center w-full">
                    {entry?.photo ? (
                      /*
                        사진: w-9/w-11 고정 너비 + aspect-square 로 높이 결정
                        → h-full 의존 없음, 부모 높이에 영향을 주지 않음
                      */
                      <div className="relative w-9 lg:w-11 aspect-square shrink-0 rounded-xl overflow-hidden shadow-sm">
                        <Image src={entry.photo} alt="Daily" fill className="object-cover" />
                        {entry.ai_status === 'PROCESSING' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : entry?.hasDiary ? (
                      <div
                        className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                          isSelected ? 'bg-main-yellow' : 'bg-main-green/40'
                        }`}
                      />
                    ) : null}
                  </div>

                  {/* 오늘 표시 점 */}
                  <div className="shrink-0 h-1.5 flex items-center justify-center">
                    {isToday && <div className="w-1 h-1 rounded-full bg-main-green" />}
                  </div>

                </div>

                {/* 이벤트 아이콘: 버튼 우상단 */}
                {dayEvents.length > 0 && (
                  <div className="absolute top-1.5 right-1.5 pointer-events-none">
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
