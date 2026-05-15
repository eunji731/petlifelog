'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  Share2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useDiary } from '@/app/common/hooks/useDiary';
import { getImagePath } from '@/app/common/lib/clientApi';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import TimelineDatePicker from './TimelineDatePicker';
import { useToast } from '@/app/common/hooks/useToast';

interface MonthlyTimelineProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  initialDateRange?: { start: string; end: string };
}

export default function MonthlyTimeline({ currentDate, onDateSelect, initialDateRange }: MonthlyTimelineProps) {
  const { allLogs, syncFromBackend } = useDiary();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Date Filter States
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(
    initialDateRange || { start: '', end: '' }
  );

  // Sync from backend when date range changes
  useEffect(() => {
    if (dateRange.start || dateRange.end) {
      syncFromBackend({ startDate: dateRange.start, endDate: dateRange.end });
    }
  }, [dateRange.start, dateRange.end, syncFromBackend]);

  // 기간 필터 또는 현재 월에 해당하는 로그들을 필터링하고 정렬
  const monthlyLogs = allLogs
    .filter(log => {
      const logDate = new Date(log.dateKey);
      if (dateRange.start || dateRange.end) {
        const logDateStr = log.dateKey;
        if (dateRange.start && logDateStr < dateRange.start) return false;
        if (dateRange.end && logDateStr > dateRange.end) return false;
        return true;
      }
      return logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth;
    })
    .sort((a, b) => {
      // 1. 일자별 내림차순 (최신순)
      if (b.dateKey !== a.dateKey) {
        return b.dateKey.localeCompare(a.dateKey);
      }
      
      // 2. 같은 일자 내에서는 시간순 (오름차순)
      const getEarliestTime = (log: typeof a) => {
        const timestamps = log.moments
          .flatMap(m => m.photos.map(p => p.takenAt).filter(Boolean) as string[])
          .sort();
        return timestamps.length > 0 ? timestamps[0] : '99:99';
      };
      
      return getEarliestTime(a).localeCompare(getEarliestTime(b));
    });

  // 필터링 및 정렬된 로그들을 일자별로 그룹화
  const groupedLogs = monthlyLogs.reduce((acc, log) => {
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.dateKey === log.dateKey) {
      lastGroup.logs.push(log);
    } else {
      acc.push({ dateKey: log.dateKey, logs: [log] });
    }
    return acc;
  }, [] as { dateKey: string; logs: typeof monthlyLogs }[]);

  const captureGroup = async (dateKey: string) => {
    const element = document.getElementById(`group-container-${dateKey}`);
    if (!element) return null;

    const images = Array.from(element.getElementsByTagName('img'));
    const originalSources = new Map<HTMLImageElement, string>();
    const noExportElements = element.querySelectorAll('.no-export');
    const captureFixStyle = document.createElement('style');

    try {
      // lazy load된 이미지가 아직 로드되지 않은 경우 대기
      await Promise.all(
        images.map(img => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>(resolve => {
            const timer = setTimeout(resolve, 3000);
            img.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
            img.addEventListener('error', () => { clearTimeout(timer); resolve(); }, { once: true });
          });
        })
      );

      await Promise.all(
        images.map(async (img) => {
          // currentSrc: 실제 로드된 URL(srcset에서 선택된 URL), src 속성 fallback
          const src = img.currentSrc || img.getAttribute('src');
          if (src && !src.startsWith('data:')) {
            try {
              originalSources.set(img, img.getAttribute('src') || src);
              const response = await fetch(src);
              const blob = await response.blob();
              const reader = new FileReader();
              const dataUrl = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              img.src = dataUrl;
            } catch (e) {
              console.warn(`Failed to pre-fetch image ${src}:`, e);
            }
          }
        })
      );

      noExportElements.forEach(el => (el as HTMLElement).style.opacity = '0');

      // 다크모드에서도 흰 배경 캡처: .light 클래스로 CSS 변수를 라이트모드 값으로 강제
      element.classList.add('light');
      // backdrop-blur는 html-to-image에서 회색 아티팩트 발생 → 제거
      // bg-background/60의 반투명 배경도 흰색으로 강제해 회색 배경 방지
      captureFixStyle.textContent = `
        #group-container-${dateKey} {
          background-color: #ffffff !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        #group-container-${dateKey} * {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      `;
      document.head.appendChild(captureFixStyle);

      await new Promise(resolve => setTimeout(resolve, 300));

      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        pixelRatio: 2,
        style: { padding: '40px' }
      });

      return dataUrl;
    } catch (err) {
      console.error('Capture process failed:', err);
      throw err;
    } finally {
      element.classList.remove('light');
      if (captureFixStyle.parentNode) document.head.removeChild(captureFixStyle);
      originalSources.forEach((src, img) => { img.src = src; });
      noExportElements.forEach(el => (el as HTMLElement).style.opacity = '1');
    }
  };

  const handleExportGroup = async (dateKey: string, format: 'png' | 'pdf') => {
    try {
      setIsExporting(dateKey);
      const dataUrl = await captureGroup(dateKey);
      if (!dataUrl) return;

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `petlifelog-${dateKey}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const img = new globalThis.Image();
        img.src = dataUrl;
        await new Promise((resolve) => (img.onload = resolve));
        const pdf = new jsPDF({ unit: 'px', format: [img.width, img.height], orientation: img.width > img.height ? 'l' : 'p' });
        pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
        pdf.save(`petlifelog-${dateKey}.pdf`);
      }
    } catch (err: any) {
      console.error('Export failed', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex-1 relative overflow-y-auto no-scrollbar bg-surface-green/20 flex flex-col">
      {/* Date Filter Bar - Always Visible */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border p-3 lg:px-10 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-green/10 px-3 py-1.5 rounded-xl border border-main-green/10">
          <Calendar className="w-4 h-4 text-main-green" />
          <span className="text-[11px] lg:text-xs font-black text-main-green">기간 필터</span>
        </div>
        <div className="flex items-center gap-2">
          <TimelineDatePicker 
            value={dateRange.start} 
            onChange={(val) => {
              if (val && dateRange.end && val > dateRange.end) {
                toast('시작일은 종료일보다 늦을 수 없습니다.', 'warning');
                return;
              }
              setDateRange(prev => ({ ...prev, start: val }));
            }}
            label="시작일"
          />
          <span className="text-text-sub text-xs">~</span>
          <TimelineDatePicker 
            value={dateRange.end} 
            onChange={(val) => {
              if (val && dateRange.start && val < dateRange.start) {
                toast('종료일은 시작일보다 빠를 수 없습니다.', 'warning');
                return;
              }
              setDateRange(prev => ({ ...prev, end: val }));
            }}
            label="종료일"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] lg:text-xs font-bold text-text-sub">
            총 <span className="text-main-green font-black">{monthlyLogs.length}</span>개의 기록
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto h-full">
          {allLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center shadow-inner">
                <Calendar className="w-10 h-10 text-main-green opacity-20" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text-main">추억이 아직 없어요</h3>
                <p className="text-text-sub font-bold mt-2 leading-relaxed">아이와의 소중한 순간들을 기록으로 남겨보세요!</p>
              </div>
            </div>
          ) : monthlyLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm mx-auto opacity-50">
                <Sparkles className="w-8 h-8 text-main-green" />
              </div>
              <p className="text-sm font-bold text-text-sub">선택하신 기간에는 기록이 없습니다.</p>
              <button onClick={() => setDateRange({ start: '', end: '' })} className="text-xs font-black text-main-green hover:underline">필터 초기화하기</button>
            </div>
          ) : (
            <div className="pt-8 space-y-24 relative before:absolute before:left-1/2 before:top-4 before:bottom-4 before:w-0.5 before:bg-main-green/10 before:-translate-x-1/2">
              {groupedLogs.map((group) => (
                <div key={group.dateKey} id={`group-container-${group.dateKey}`} className="relative bg-background/60 backdrop-blur-sm rounded-[48px] p-6 lg:p-12 border border-border shadow-xl shadow-main-green/5 transition-all hover:shadow-2xl hover:shadow-main-green/10 group/container">
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-3">
                    <div className="px-6 py-2 bg-main-green text-white text-xs font-black rounded-full shadow-lg shadow-main-green/20 whitespace-nowrap border-2 border-background">{group.dateKey}</div>
                    <div className="flex items-center gap-2 no-export">
                      <button onClick={() => handleExportGroup(group.dateKey, 'png')} disabled={!!isExporting} className="flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur-md border border-border rounded-xl text-text-sub hover:text-main-green transition-all shadow-sm active:scale-95 disabled:opacity-50 group/btn">
                        {isExporting === group.dateKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-black">이미지</span>
                      </button>
                      <button onClick={() => handleExportGroup(group.dateKey, 'pdf')} disabled={!!isExporting} className="flex items-center gap-1.5 px-3 py-1.5 bg-background/90 backdrop-blur-md border border-border rounded-xl text-text-sub hover:text-main-green transition-all shadow-sm active:scale-95 disabled:opacity-50 group/btn">
                        {isExporting === group.dateKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-black">PDF</span>
                      </button>
                    </div>
                  </div>
                  <div className="pt-10 space-y-20">
                    {group.logs.map((log, lIdx) => (
                      <div key={log.id} className={`space-y-8 ${lIdx > 0 ? 'pt-20 border-t border-main-green/5' : ''}`}>
                        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 px-6">
                          <div className="w-10 h-10 bg-background rounded-2xl flex items-center justify-center shadow-sm mb-4"><Sparkles className="w-5 h-5 text-main-yellow fill-main-yellow" /></div>
                          <h2 className="text-2xl font-black text-text-main mb-3 leading-tight">{log.aiTitle}</h2>
                          <p className="text-sm font-medium text-text-sub italic">&quot;{log.aiSummary}&quot;</p>
                        </div>
                        {log.moments.map((moment, mIdx) => (
                          <div key={moment.id} className={`flex flex-col md:flex-row gap-8 items-center ${mIdx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                            <div className="w-full md:w-1/2 px-4">
                              <div className="relative aspect-video rounded-[32px] overflow-hidden shadow-xl group border-4 border-background">
                                <Image src={getImagePath(moment.photos[0]?.path) || '/dog-profile.png'} alt={moment.aiTitle} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute top-4 left-4 px-3 py-1 bg-background/90 backdrop-blur-md rounded-full text-[9px] font-black text-main-green shadow-sm">{moment.category}</div>
                              </div>
                            </div>
                            <div className="w-full md:w-1/2 px-4 space-y-4 text-center md:text-left">
                              <div className="flex items-center justify-center md:justify-start gap-3 text-text-sub font-black text-[10px] uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5 text-main-green" /> {moment.eventTime ? new Date(moment.eventTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : 'Moment'}
                                <span className="w-1 h-1 bg-text-sub/30 rounded-full" /><MapPin className="w-3.5 h-3.5 text-main-green" /> {moment.locationName || '어딘가'}
                              </div>
                              <h3 className="text-xl font-black text-text-main group-hover:text-main-green transition-colors">{moment.aiTitle}</h3>
                              <p className="text-sm font-medium text-text-main/80 leading-relaxed italic line-clamp-3">&quot;{moment.aiContent}&quot;</p>
                              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-2">{moment.tags.map(tag => (<span key={tag} className="text-[10px] font-bold text-text-sub whitespace-nowrap">#{tag}</span>))}</div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-center pt-4 no-export">
                          <button onClick={() => onDateSelect(new Date(log.dateKey))} className="px-6 py-2.5 bg-background border border-border text-main-green text-[11px] font-black rounded-full hover:bg-main-green hover:text-white transition-all shadow-sm flex items-center gap-2 group">이날의 기록 상세보기 <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></button>
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
