'use client';

import React from 'react';
import { X, Calendar, MapPin, Sparkles, TrendingUp, Zap, Clock, ChevronRight, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useDiary, DailyLog } from '@/app/common/hooks/useDiary';
import clientApi, { getImagePath } from '@/app/common/lib/clientApi';
import { useConfirm } from '@/app/common/hooks/useConfirm';
import { useToast } from '@/app/common/hooks/useToast';
import MomentImageSlider from './MomentImageSlider';

interface DiaryPreviewProps {
  date: Date;
  onEdit: (data: DailyLog) => void;
  onClose?: () => void;
  isExpanded?: boolean;
}

export default function DiaryPreview({
  date,
  onEdit,
  onClose,
  isExpanded = false
}: DiaryPreviewProps) {
  const { getDailyLogsForDate, removeDailyLog } = useDiary();
  const { confirm } = useConfirm();
  const { success, error } = useToast();
  const dateKey = date.toLocaleDateString('en-CA');
  const logs = getDailyLogsForDate(dateKey);

  const handleDelete = async (logId: string) => {
    const isConfirmed = await confirm('이 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.');
    if (!isConfirmed) return;

    try {
      await clientApi.delete(`/api/memories/${logId}`);
      removeDailyLog(logId, dateKey);
      success('기록이 삭제되었습니다.');
      if (logs.length <= 1) {
        onClose?.();
      }
    } catch {
      error('삭제에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto no-scrollbar touch-pan-y bg-surface-green/20">
        <div className="max-w-4xl mx-auto min-h-full bg-background shadow-2xl flex flex-col items-center justify-center p-10 text-center space-y-6">
          <div className="w-24 h-24 bg-surface-green rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-main-green opacity-40" />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main">아직 기록이 없어요</h3>
            <p className="text-text-sub font-bold mt-2 leading-relaxed">오늘 아이와 어떤 추억을 만드셨나요?<br/>사진을 일괄 업로드하면 AI가 정리해 드려요!</p>
          </div>
        </div>
      </div>
    </div>
  );

  // [기존 디자인] 달력이 보일 때 (Classic Layout)
  const renderClassicContent = () => {
    if (logs.length === 0) return renderEmptyState();

    return (
      <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-500">
        <div className="flex-1 overflow-y-auto no-scrollbar touch-pan-y bg-surface-green/20 space-y-4 lg:space-y-8">
          {logs.map((log) => (
            <div key={log.id} className="max-w-4xl mx-auto bg-background shadow-2xl first:mt-0">
              <div className="bg-background border-b border-border overflow-hidden">
                {log.representativePhotoPath && (
                  <div className="relative w-full h-48 lg:h-80 bg-surface-green/5">
                    <Image src={getImagePath(log.representativePhotoPath)} alt="대표 사진" fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                <div className="p-6 lg:p-10 space-y-4 lg:space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-main-green/10 rounded-2xl flex items-center justify-center shrink-0"><Sparkles className="w-6 h-6 text-main-green" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-main-green uppercase tracking-widest px-2 py-0.5 bg-main-green/10 rounded-full">Daily Summary</span>
                      </div>
                      <h1 className="text-xl lg:text-3xl font-black text-text-main tracking-tight leading-tight">{log.aiTitle}</h1>
                    </div>
                  </div>
                  <div className="relative pl-6 border-l-4 border-main-green/20">
                    <p className="text-base lg:text-lg font-medium text-text-main leading-relaxed italic">&quot;{log.aiSummary}&quot;</p>
                  </div>
                </div>
              </div>

              <div className="p-6 lg:p-10 space-y-8 lg:space-y-10 bg-background">
                <h3 className="text-lg lg:text-xl font-black text-text-main flex items-center gap-2.5 px-2"><Clock className="w-5 h-5 text-main-green" /> 모멘트 타임라인</h3>
                <div className="relative space-y-8 lg:space-y-12 before:absolute before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-main-green/10">
                  {log.moments.map((moment) => (
                    <div key={moment.id} className="relative pl-16 lg:pl-20 group">
                      <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-main-green border-4 border-background shadow-md z-10" />
                      <div className="bg-background rounded-[24px] lg:rounded-[32px] overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-500">
                        {moment.photos && moment.photos.length > 0 && (
                          <div className="relative w-full h-48 lg:h-64 bg-surface-green/5">
                            <MomentImageSlider photos={moment.photos} alt={moment.aiTitle} />
                          </div>
                        )}
                        <div className="p-5 lg:p-8 space-y-4">
                          <h4 className="text-lg lg:text-2xl font-black text-text-main leading-tight">{moment.aiTitle}</h4>
                          <div className="flex items-center gap-4 text-xs font-bold text-text-sub">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-main-green" /> {moment.locationName || '어딘가'}</span>
                          </div>
                          <p className="text-sm lg:text-base font-medium text-text-main/80 leading-relaxed italic">&quot;{moment.aiContent}&quot;</p>
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border mt-2">
                            {moment.tags.map(t => <span key={t} className="px-3 py-1 bg-surface-green dark:bg-white/5 text-text-sub text-[10px] font-bold rounded-lg border border-border">#{t}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 pb-6 flex gap-4">
                  <button 
                    onClick={() => onEdit(log)} 
                    className="flex-[2] py-4 bg-background border-2 border-main-green text-main-green font-black rounded-[20px] hover:bg-main-green hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 group"
                  >
                    재기록하기 <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="flex-1 py-4 bg-background border-2 border-red-200 text-red-500 font-black rounded-[20px] hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // [매거진 디자인] 달력을 접었을 때 (Magazine Layout)
  const renderMagazineContent = () => {
    if (logs.length === 0) return renderEmptyState();

    return (
      <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-500">
        <div className="flex-1 overflow-y-auto no-scrollbar touch-pan-y bg-background space-y-20">
          {logs.map((log) => (
            <div key={log.id} className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-full border-b border-border/50 last:border-b-0">
              <div className="lg:w-[40%] p-6 lg:p-16 lg:sticky lg:top-0 lg:h-[calc(100vh-80px)] flex flex-col overflow-y-auto no-scrollbar">
                <div className="space-y-8 lg:space-y-12 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-main-green text-white text-[10px] lg:text-xs font-black rounded-full shadow-lg shadow-main-green/20 uppercase tracking-[0.2em]">Daily Log</span>
                    <span className="text-[10px] lg:text-xs font-black text-text-sub uppercase tracking-widest">{log.moments.length} Events Captured</span>
                  </div>
                  <h1 className="text-3xl lg:text-6xl font-black text-text-main leading-[1.1] tracking-tight">{log.aiTitle}</h1>
                  <div className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 before:bg-main-green before:rounded-full">
                    <p className="text-lg lg:text-2xl font-medium text-text-main/70 leading-relaxed italic">&quot;{log.aiSummary}&quot;</p>
                  </div>
                  {log.representativePhotoPath && (
                    <div className="relative aspect-[4/3] rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl group cursor-pointer">
                      <Image src={getImagePath(log.representativePhotoPath)} alt="대표 사진" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    </div>
                  )}
                </div>
                <div className="hidden lg:flex mt-auto pt-12 items-center gap-4 text-text-sub/40 border-t border-border/50">
                  <Sparkles className="w-5 h-5" /><p className="text-xs font-bold tracking-tight">AI-generated archive based on your photos</p>
                </div>
              </div>

              <div className="lg:w-[60%] bg-surface-green/10 p-6 lg:p-16 lg:pl-0">
                <div className="space-y-12 lg:space-y-20">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl lg:text-3xl font-black text-text-main flex items-center gap-4"><Clock className="w-6 h-6 lg:w-10 lg:h-10 text-main-green" /> Timeline</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEdit(log)} className="px-6 py-2.5 bg-background text-main-green text-xs font-black rounded-full border-2 border-main-green/20 hover:border-main-green transition-all shadow-sm">Re-record</button>
                      <button 
                        onClick={() => handleDelete(log.id)}
                        className="p-2.5 bg-background text-red-500 rounded-full border-2 border-red-50 hover:bg-red-50 transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="relative space-y-12 lg:space-y-24">
                    {log.moments.map((moment, idx) => (
                      <div key={moment.id} className="relative group">
                        <div className="absolute -left-4 lg:-left-8 top-0 bottom-0 w-px bg-main-green/10" />
                        <div className="absolute -left-[21px] lg:-left-[37px] top-10 w-3 h-3 rounded-full bg-main-green border-4 border-background shadow-md z-10" />
                        <div className="flex flex-col space-y-6 lg:space-y-10">
                          <div className="flex items-center gap-4">
                            <span className="text-[48px] lg:text-[72px] font-black text-main-green/10 leading-none tabular-nums">{(idx + 1).toString().padStart(2, '0')}</span>
                            <div className="space-y-1">
                              <p className="text-[10px] lg:text-xs font-black text-main-green uppercase tracking-widest">{moment.category}</p>
                              <p className="text-xs lg:text-sm font-bold text-text-sub flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {moment.locationName || 'Location Unknown'}</p>
                            </div>
                          </div>
                          <div className="bg-background rounded-[32px] lg:rounded-[56px] overflow-hidden border border-border/50 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                            {moment.photos && moment.photos.length > 0 && (
                              <div className="relative w-full aspect-video bg-surface-green/5">
                                <MomentImageSlider photos={moment.photos} alt={moment.aiTitle} />
                              </div>
                            )}
                            <div className="p-8 lg:p-14 space-y-6 lg:space-y-10">
                              <h4 className="text-2xl lg:text-5xl font-black text-text-main leading-[1.15] tracking-tight">{moment.aiTitle}</h4>
                              <p className="text-base lg:text-2xl font-medium text-text-main/60 leading-relaxed italic">&quot;{moment.aiContent}&quot;</p>
                              <div className="flex flex-wrap gap-2 lg:gap-3 pt-8 border-t border-border/50">
                                {moment.tags.map(t => <span key={t} className="px-5 py-2 bg-surface-green/50 text-text-sub text-[11px] lg:text-sm font-bold rounded-2xl">#{t}</span>)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-hidden shadow-[-12px_0_32px_rgba(0,0,0,0.03)] relative">
      <div className="sticky top-0 z-[20] bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 lg:px-6 lg:py-4 flex justify-between items-center shadow-sm shrink-0">
        <h2 className="text-lg lg:text-xl font-black text-text-main tracking-tight">{formattedDate}</h2>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-surface-green rounded-xl transition-all">
            <X className="w-6 h-6 text-text-sub" />
          </button>
        )}
      </div>
      {isExpanded ? renderMagazineContent() : renderClassicContent()}
    </div>
  );
}
