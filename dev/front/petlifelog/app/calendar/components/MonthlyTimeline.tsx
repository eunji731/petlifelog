'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, Heart, MapPin, Sparkles, Zap, Clock, ChevronRight } from 'lucide-react';
import { useDiary } from '@/app/common/hooks/useDiary';
import { getImagePath } from '@/app/common/lib/clientApi';

interface MonthlyTimelineProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function MonthlyTimeline({ currentDate, onDateSelect }: MonthlyTimelineProps) {
  const { allLogs } = useDiary();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 현재 월의 로그만 필터링
  const monthlyLogs = allLogs.filter(log => {
    const logDate = new Date(log.dateKey);
    return logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth;
  });

  if (monthlyLogs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 bg-surface-green/5">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner">
          <Calendar className="w-10 h-10 text-main-green opacity-20" />
        </div>
        <div>
          <h3 className="text-xl font-black text-text-main">이번 달엔 아직 추억이 없어요</h3>
          <p className="text-text-sub font-bold mt-2 leading-relaxed">
            아이와의 소중한 순간들을<br />기록으로 남겨보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 bg-surface-green/20">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-16 relative before:absolute before:left-4 md:before:left-1/2 before:top-4 before:bottom-4 before:w-0.5 before:bg-main-green/10 before:-translate-x-1/2">
          {monthlyLogs.map((log, logIdx) => (
            <div key={log.id} className="relative">
              {/* Date Marker */}
              <div className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 z-10">
                <div className="px-4 py-1.5 bg-main-green text-white text-[10px] font-black rounded-full shadow-lg whitespace-nowrap">
                  {log.dateKey}
                </div>
              </div>

              <div className="pt-10 space-y-8">
                {/* Daily Summary Preview */}
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 px-6">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <Sparkles className="w-5 h-5 text-main-yellow fill-main-yellow" />
                  </div>
                  <h2 className="text-2xl font-black text-text-main mb-3 leading-tight">{log.aiTitle}</h2>
                  <p className="text-sm font-medium text-text-sub italic">&quot;{log.aiSummary}&quot;</p>
                </div>

                {/* Individual Moments */}
                {log.moments.map((moment, mIdx) => (
                  <div key={moment.id} className={`flex flex-col md:flex-row gap-8 items-center ${mIdx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    {/* Photo Side */}
                    <div className="w-full md:w-1/2 px-4">
                      <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-xl group border-4 border-white">
                        <Image 
                          src={getImagePath(moment.photos[0]?.path) || '/dog-profile.png'} 
                          alt={moment.aiTitle} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                        />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black text-main-green shadow-sm">
                          {moment.category}
                        </div>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="w-full md:w-1/2 px-4 space-y-4 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-3 text-text-sub font-black text-[10px] uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5 text-main-green" /> {moment.eventTime ? new Date(moment.eventTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : 'Moment'}
                        <span className="w-1 h-1 bg-text-sub/30 rounded-full" />
                        <MapPin className="w-3.5 h-3.5 text-main-green" /> {moment.locationName || '어딘가'}
                      </div>
                      <h3 className="text-xl font-black text-text-main group-hover:text-main-green transition-colors">{moment.aiTitle}</h3>
                      <p className="text-sm font-medium text-text-main/80 leading-relaxed italic line-clamp-3">
                        &quot;{moment.aiContent}&quot;
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-2">
                        {moment.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-text-sub">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => onDateSelect(new Date(log.dateKey))}
                    className="px-6 py-2.5 bg-white border border-border text-main-green text-[11px] font-black rounded-full hover:bg-main-green hover:text-white transition-all shadow-sm flex items-center gap-2 group"
                  >
                    이날의 기록 상세보기 <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
