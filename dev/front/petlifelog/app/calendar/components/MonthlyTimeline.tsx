'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { 
  Calendar, 
  MapPin, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  Download, 
  Image as ImageIcon, 
  FileText,
  Loader2,
  Share2
} from 'lucide-react';
import { useDiary } from '@/app/common/hooks/useDiary';
import { getImagePath, default as clientApi } from '@/app/common/lib/clientApi';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface MonthlyTimelineProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function MonthlyTimeline({ currentDate, onDateSelect }: MonthlyTimelineProps) {
  const { allLogs } = useDiary();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Date Filter States
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  // 현재 월의 로그만 필터링 + 선택된 기간 필터링
  const monthlyLogs = allLogs
    .filter(log => {
      const logDate = new Date(log.dateKey);
      return logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth;
    })
    .filter(log => {
      if (!dateRange.start && !dateRange.end) return true;
      const logDateStr = log.dateKey;
      if (dateRange.start && logDateStr < dateRange.start) return false;
      if (dateRange.end && logDateStr > dateRange.end) return false;
      return true;
    })
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey)); // 최신순

  const captureSingleLog = async (logId: string) => {
    const element = document.getElementById(`log-container-${logId}`);
    if (!element) return null;
    
    try {
      // Find all images in the log container
      const images = Array.from(element.getElementsByTagName('img'));
      const originalSources = new Map<HTMLImageElement, string>();

      // Convert all images to Data URLs
      await Promise.all(
        images.map(async (img) => {
          const src = img.getAttribute('src');
          if (src && !src.startsWith('data:')) {
            try {
              originalSources.set(img, src);
              const response = await clientApi.get(src, { responseType: 'blob' });
              const reader = new FileReader();
              const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(response.data);
              });
              img.src = dataUrl;
            } catch (e) {
              console.warn(`Failed to pre-fetch image ${src}:`, e);
            }
          }
        })
      );

      // Hide non-export elements
      const noExportElements = element.querySelectorAll('.no-export');
      noExportElements.forEach(el => (el as HTMLElement).style.opacity = '0');
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        pixelRatio: 2,
        style: {
          padding: '40px',
        }
      });

      // Restore
      originalSources.forEach((src, img) => {
        img.src = src;
      });
      noExportElements.forEach(el => (el as HTMLElement).style.opacity = '1');

      return dataUrl;
    } catch (err) {
      console.error('Capture process failed:', err);
      throw err;
    }
  };

  const handleExportSingle = async (logId: string, logDate: string, format: 'png' | 'pdf') => {
    try {
      setIsExporting(logId);
      
      const dataUrl = await captureSingleLog(logId);
      if (!dataUrl) return;
      
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `petlifelog-${logDate}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const img = new globalThis.Image();
        img.src = dataUrl;
        await new Promise((resolve) => (img.onload = resolve));

        const pdf = new jsPDF({
          unit: 'px',
          format: [img.width, img.height],
          orientation: img.width > img.height ? 'l' : 'p'
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
        pdf.save(`petlifelog-${logDate}.pdf`);
      }
    } catch (err: any) {
      console.error('Export failed', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(null);
    }
  };

  if (allLogs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6 bg-surface-green/5">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner">
          <Calendar className="w-10 h-10 text-main-green opacity-20" />
        </div>
        <div>
          <h3 className="text-xl font-black text-text-main">추억이 아직 없어요</h3>
          <p className="text-text-sub font-bold mt-2 leading-relaxed">
            아이와의 소중한 순간들을<br />기록으로 남겨보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-y-auto no-scrollbar bg-surface-green/20 flex flex-col">
      {/* Date Filter Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border p-3 lg:px-10 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-green/10 px-3 py-1.5 rounded-xl border border-main-green/10">
          <Calendar className="w-4 h-4 text-main-green" />
          <span className="text-[11px] lg:text-xs font-black text-main-green">기간 필터</span>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="text-[11px] lg:text-xs font-bold border border-border rounded-lg px-2 py-1 focus:outline-none focus:border-main-green"
          />
          <span className="text-text-sub text-xs">~</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="text-[11px] lg:text-xs font-bold border border-border rounded-lg px-2 py-1 focus:outline-none focus:border-main-green"
          />
          <button 
            onClick={() => setDateRange({ start: '', end: '' })}
            className="text-[10px] font-black text-text-sub hover:text-red-500 transition-colors px-2"
          >
            초기화
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] lg:text-xs font-bold text-text-sub">
            총 <span className="text-main-green font-black">{monthlyLogs.length}</span>개의 기록
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          {monthlyLogs.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto opacity-50">
                <Sparkles className="w-8 h-8 text-main-green" />
              </div>
              <p className="text-sm font-bold text-text-sub">선택하신 기간에는 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-24 relative before:absolute before:left-4 md:before:left-1/2 before:top-4 before:bottom-4 before:w-0.5 before:bg-main-green/10 before:-translate-x-1/2">
              {monthlyLogs.map((log, logIdx) => (
                <div key={log.id} id={`log-container-${log.id}`} className="relative bg-white/60 backdrop-blur-sm rounded-[48px] p-6 lg:p-12 border border-white shadow-xl shadow-main-green/5 transition-all hover:shadow-2xl hover:shadow-main-green/10 group/container">
                  {/* Date Marker & Individual Export */}
                  <div className="absolute left-4 md:left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-3">
                    <div className="px-6 py-2 bg-main-green text-white text-xs font-black rounded-full shadow-lg shadow-main-green/20 whitespace-nowrap border-2 border-white">
                      {log.dateKey}
                    </div>
                    
                    <div className="flex items-center gap-2 no-export opacity-0 group-hover/container:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={() => handleExportSingle(log.id, log.dateKey, 'png')}
                        disabled={!!isExporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-border rounded-xl text-text-sub hover:text-main-green hover:border-main-green/30 transition-all shadow-sm active:scale-95 disabled:opacity-50 group/btn"
                      >
                        {isExporting === log.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 group/btn:scale-110 transition-transform" />}
                        <span className="text-[10px] font-black">이미지</span>
                      </button>
                      <button 
                        onClick={() => handleExportSingle(log.id, log.dateKey, 'pdf')}
                        disabled={!!isExporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-border rounded-xl text-text-sub hover:text-main-green hover:border-main-green/30 transition-all shadow-sm active:scale-95 disabled:opacity-50 group/btn"
                      >
                        {isExporting === log.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 group/btn:scale-110 transition-transform" />}
                        <span className="text-[10px] font-black">PDF</span>
                      </button>
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
                    
                    <div className="flex justify-center pt-4 no-export">
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
          )}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-export {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
