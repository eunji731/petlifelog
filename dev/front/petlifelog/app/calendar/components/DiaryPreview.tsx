'use client';

import React from 'react';
import { X, Calendar, MapPin, Sparkles, TrendingUp, Zap, Clock, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useDiary, DailyLog } from '@/app/common/hooks/useDiary';
import { getImagePath } from '@/app/common/lib/clientApi';
import MomentImageSlider from './MomentImageSlider';

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
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-surface-green/20">
          {/* Daily Summary (Simplified) */}
          <div className="bg-white border-b border-border overflow-hidden">
            {log.representativePhotoPath && (
              <div className="relative w-full h-48 lg:h-64 bg-surface-green/5">
                <Image 
                  src={getImagePath(log.representativePhotoPath)} 
                  alt="오늘의 대표 사진" 
                  fill 
                  className="object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}
            <div className="p-6 lg:p-10 space-y-4 lg:space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-main-green/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-main-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-main-green uppercase tracking-widest px-2 py-0.5 bg-main-green/10 rounded-full">Daily Summary</span>
                    <span className="text-[10px] font-black text-text-sub">{log.moments.length} Moments</span>
                  </div>
                  <h1 className="text-xl lg:text-3xl font-black text-text-main tracking-tight leading-tight">{log.aiTitle}</h1>
                </div>
              </div>
              
              <div className="relative pl-6 border-l-2 border-main-green/20">
                <p className="text-base lg:text-lg font-medium text-text-main leading-relaxed italic">
                  &quot;{log.aiSummary}&quot;
                </p>
              </div>
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
                  
                  <div className="bg-white rounded-[24px] lg:rounded-[32px] overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-500">
                    {moment.photos && moment.photos.length > 0 && (
                      <div className="relative w-full h-48 lg:h-64 bg-surface-green/5">
                        <MomentImageSlider 
                          photos={moment.photos} 
                          alt={moment.aiTitle} 
                        />
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black text-main-green shadow-sm z-10">
                          {moment.category}
                        </div>
                      </div>
                    )}
                    
                    <div className="p-5 lg:p-6 space-y-3 lg:space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-lg lg:text-2xl font-black text-text-main leading-tight group-hover:text-main-green transition-colors">{moment.aiTitle}</h4>
                        <div className="flex items-center gap-1 text-amber-500 font-black text-[10px] bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 shrink-0">
                          <Zap className="w-3.5 h-3.5 fill-current" /> Lv.{moment.energyLevel}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-bold text-text-sub">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-main-green" /> {moment.locationName || '어딘가'}</span>
                      </div>
                      
                      <p className="text-sm lg:text-base font-medium text-text-main/80 leading-relaxed italic">
                        &quot;{moment.aiContent}&quot;
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border mt-2">
                        {moment.tags.map(t => (
                          <span key={t} className="px-3 py-1 bg-surface-green text-text-sub text-[10px] font-bold rounded-lg border border-border">#{t}</span>
                        ))}
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
