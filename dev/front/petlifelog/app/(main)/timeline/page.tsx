'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Heart, MessageCircle, MapPin, Sparkles, Zap, Clock } from 'lucide-react';
import { useDiary } from '@/app/common/hooks/useDiary';
import { getImagePath } from '@/app/common/lib/clientApi';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function TimelineContent() {
  const { allLogs } = useDiary();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const filteredLogs = dateParam 
    ? allLogs.filter(log => log.dateKey === dateParam)
    : allLogs;

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    // 1. 일자별 내림차순 (최신순)
    if (b.dateKey !== a.dateKey) {
      return b.dateKey.localeCompare(a.dateKey);
    }
    
    // 2. 같은 일자 내에서는 시간순 (오름차순)
    const getEarliestTime = (log: typeof a) => {
      const timestamps = log.moments
        .flatMap(m => m.photos.map(p => p.takenAt).filter(Boolean) as string[])
        .sort();
      return timestamps.length > 0 ? timestamps[0] : '99:99'; // 시간 정보 없으면 뒤로
    };
    
    return getEarliestTime(a).localeCompare(getEarliestTime(b));
  });

  const groupedLogs = sortedLogs.reduce((acc, log) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.dateKey === log.dateKey) {
      lastGroup.logs.push(log);
    } else {
      acc.push({ dateKey: log.dateKey, logs: [log] });
    }
    return acc;
  }, [] as { dateKey: string; logs: typeof sortedLogs }[]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border p-6 lg:p-10 shrink-0">
        <div className="max-w-4xl mx-auto flex items-end justify-between">
          <div>
            <span className="text-xs font-black text-main-green tracking-widest uppercase mb-1 block">Timeline</span>
            <h1 className="text-3xl lg:text-4xl font-black text-text-main tracking-tight">아이와의 시간 여행</h1>
            <p className="text-text-sub text-sm lg:text-base font-bold mt-2">우리가 함께한 모든 순간들을 시간 순서대로 만나보세요.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 bg-surface-green/20">
        <div className="max-w-4xl mx-auto">
          {groupedLogs.length === 0 ? (
            <div className="py-40 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-inner">
                <Calendar className="w-10 h-10 text-main-green opacity-20" />
              </div>
              <p className="text-text-sub font-bold">기록된 추억이 아직 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-24 relative before:absolute before:left-4 md:before:left-1/2 before:top-4 before:bottom-4 before:w-0.5 before:bg-main-green/10 before:-translate-x-1/2">
              {groupedLogs.map((group) => (
                <div key={group.dateKey} className="relative">
                  {/* Date Marker */}
                  <div className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 z-10">
                    <div className="px-4 py-1.5 bg-main-green text-white text-[10px] font-black rounded-full shadow-lg whitespace-nowrap">
                      {group.dateKey}
                    </div>
                  </div>

                  <div className="pt-10 space-y-12">
                    {group.logs.map((log, lIdx) => (
                      <div key={log.id} className={`space-y-8 ${lIdx > 0 ? 'pt-12 border-t border-main-green/5' : ''}`}>
                        {/* Daily Summary Preview */}
                        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 px-6">
                          <div className="w-10 h-10 bg-background rounded-2xl flex items-center justify-center shadow-sm mb-4">
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
                              <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-xl group border-4 border-background">
                                <Image src={getImagePath(moment.photos[0]?.path) || '/dog-profile.png'} alt={moment.aiTitle} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-md rounded-full text-[9px] font-black text-main-green shadow-sm">
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
                          <Link 
                            href={`/calendar?date=${log.dateKey}`}
                            className="px-6 py-2.5 bg-background border border-border text-main-green text-[11px] font-black rounded-full hover:bg-main-green hover:text-white transition-all shadow-sm"
                          >
                            이날의 기록 상세보기
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-background text-sm font-bold text-text-sub">불러오는 중...</div>}>
      <TimelineContent />
    </Suspense>
  );
}
