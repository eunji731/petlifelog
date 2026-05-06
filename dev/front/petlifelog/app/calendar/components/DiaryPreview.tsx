'use client';

import React from 'react';
import { X, Calendar, MapPin, Sparkles, TrendingUp, Zap, Clock, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useDiary, DailyLog } from '@/app/common/hooks/useDiary';

interface DiaryPreviewProps {
  date: Date;
  onEdit: (data: DailyLog) => void;
  onClose?: () => void;
}

export default function DiaryPreview({
  date,
  onEdit,
  onClose
}: DiaryPreviewProps) {
  const { getDailyLog } = useDiary();
  const dateKey = date.toISOString().split('T')[0];
  const log = getDailyLog(dateKey);

  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6 animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-surface-green rounded-full flex items-center justify-center">
        <Calendar className="w-10 h-10 text-main-green opacity-40" />
      </div>
      <div>
        <h3 className="text-xl font-black text-text-main">아직 기록이 없어요</h3>
        <p className="text-text-sub font-bold mt-2 leading-relaxed">오늘 아이와 어떤 추억을 만드셨나요?<br/>사진을 일괄 업로드하면 AI가 정리해 드려요!</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!log) return renderEmptyState();

    return (
      <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-500">
        {/* Scrollable Container for everything below the sticky date header */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-surface-green/20">
          {/* Daily Summary Header - Now part of scroll */}
          <div className="relative h-[240px] lg:h-[300px] shrink-0">
            <Image 
              src={log.representativePhotoPath || '/dog-profile.png'} 
              alt="Daily Summary" 
              fill 
              className="object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2 lg:space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-main-green text-white text-[9px] lg:text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">Daily Summary</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/10">
                  <Sparkles className="w-3 h-3 text-main-yellow fill-main-yellow" />
                  <span className="text-[9px] lg:text-[10px] font-black">{log.moments.length} Moments</span>
                </div>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">{log.aiTitle}</h1>
            </div>
          </div>

          {/* AI Summary Text */}
          <div className="p-6 lg:p-10 bg-white border-b border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-surface-green rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-main-green" />
              </div>
              <p className="text-base lg:text-lg font-medium text-text-main leading-relaxed italic">&quot;{log.aiSummary}&quot;</p>
            </div>
          </div>

          {/* Moments Timeline */}
          <div className="p-6 lg:p-10 space-y-8 lg:space-y-10">
            <h3 className="text-lg lg:text-xl font-black text-text-main flex items-center gap-2.5 px-2">
              <Clock className="w-5 h-5 text-main-green" /> 모멘트 타임라인
            </h3>
            
            <div className="relative space-y-8 lg:space-y-10 before:absolute before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-main-green/10">
              {log.moments.map((moment) => (
                <div key={moment.id} className="relative pl-16 lg:pl-20 group">
                  {/* Timeline Node */}
                  <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-main-green border-4 border-white shadow-md group-hover:scale-125 transition-transform z-10" />
                  
                  <div className="bg-white rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 border border-border shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="flex flex-col gap-4 lg:gap-6">
                      <div className="relative aspect-video rounded-xl lg:rounded-2xl overflow-hidden shadow-sm">
                        <Image 
                          src={moment.photos[0]?.path || '/dog-profile.png'} 
                          alt={moment.aiTitle} 
                          fill 
                          className="object-cover transition-transform group-hover:scale-105 duration-1000" 
                        />
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black text-main-green shadow-sm">
                          {moment.category}
                        </div>
                      </div>
                      
                      <div className="space-y-3 lg:space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xl lg:text-2xl font-black text-text-main leading-tight group-hover:text-main-green transition-colors">{moment.aiTitle}</h4>
                          <div className="flex items-center gap-1 text-amber-500 font-black text-xs bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                            <Zap className="w-3.5 h-3.5 fill-current" /> Lv.{moment.energyLevel}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-bold text-text-sub">
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-main-green" /> {moment.locationName || '어딘가'}</span>
                        </div>
                        
                        <p className="text-sm lg:text-base font-medium text-text-main/80 leading-relaxed italic line-clamp-4">
                          &quot;{moment.aiContent}&quot;
                        </p>
                        
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border pt-4">
                          {moment.tags.map(t => (
                            <span key={t} className="px-3 py-1 bg-surface-green text-text-sub text-[10px] font-bold rounded-lg border border-border">#{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Action */}
            <div className="pt-6 pb-10">
              <button 
                onClick={() => onEdit(log)}
                className="w-full py-4 lg:py-5 bg-white border-2 border-main-green text-main-green font-black rounded-[20px] lg:rounded-[24px] hover:bg-main-green hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                기록 수정하기 <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full bg-white overflow-hidden shadow-[-12px_0_32px_rgba(0,0,0,0.03)] relative">
      {/* Date Header Floating */}
      <div className="sticky top-0 z-[20] bg-white/90 backdrop-blur-md border-b border-border p-4 lg:p-6 flex justify-between items-center shadow-sm shrink-0">
        <h2 className="text-lg lg:text-xl font-black text-text-main tracking-tight">{formattedDate}</h2>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-surface-green rounded-xl transition-all">
            <X className="w-6 h-6 text-text-sub" />
          </button>
        )}
      </div>
      {renderContent()}
    </div>
  );
}
