'use client';

import React from 'react';
import { useDiary } from '@/app/common/hooks/useDiary';
import { getImagePath } from '@/app/common/lib/clientApi';
import { Calendar, Search, Filter, MessageCircle, Sparkles, MapPin, Zap, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function RecordPage() {
  const { allLogs } = useDiary();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border p-6 lg:p-10 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-black text-main-green tracking-widest uppercase mb-1 block">Archive</span>
            <h1 className="text-3xl lg:text-4xl font-black text-text-main tracking-tight">추억 기록 보관함</h1>
            <p className="text-text-sub text-sm lg:text-base font-bold mt-2">아이와 함께한 모든 소중한 순간들이 계층별로 보관되어 있습니다.</p>
          </div>
          
          <div className="flex gap-2">
            <button className="p-3 bg-surface-green rounded-xl border border-border hover:bg-border transition-all"><Filter className="w-5 h-5 text-text-main" /></button>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
              <input 
                type="text" 
                placeholder="추억 검색..."
                className="pl-11 pr-4 py-3 bg-surface-green border border-border rounded-xl text-sm font-bold focus:outline-none w-48 lg:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {allLogs.length > 0 ? (
            allLogs.map((log) => (
              <div key={log.id} className="bg-background rounded-[40px] border border-border shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="flex flex-col lg:flex-row">
                  {/* Left: Summary Hero */}
                  <div className="lg:w-1/3 relative h-64 lg:h-auto overflow-hidden">
                    <Image src={getImagePath(log.representativePhotoPath) || '/dog-profile.png'} alt="Daily" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-6 left-6 px-3 py-1.5 bg-background/90 backdrop-blur-md rounded-full text-[10px] font-black text-main-green shadow-lg">
                      {log.dateKey}
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="text-xl font-black leading-tight mb-2">{log.aiTitle}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold opacity-80 uppercase tracking-widest">
                        <Sparkles className="w-3 h-3 text-main-yellow fill-main-yellow" /> {log.moments.length} Moments
                      </div>
                    </div>
                  </div>

                  {/* Right: Summary Content & Moment Preview */}
                  <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between space-y-6">
                    <div>
                      <p className="text-lg font-medium text-text-main leading-relaxed italic line-clamp-3 mb-6">
                        &quot;{log.aiSummary}&quot;
                      </p>
                      
                      <div className="space-y-3">
                        <p className="text-[11px] font-black text-main-green uppercase tracking-widest">Featured Moments</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {log.moments.slice(0, 2).map(moment => (
                            <div key={moment.id} className="flex items-center gap-3 p-3 bg-surface-green/50 rounded-2xl border border-main-green/5">
                              <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm">
                                <Image src={getImagePath(moment.photos[0]?.path) || '/dog-profile.png'} alt="Moment" fill className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-text-main truncate">{moment.aiTitle}</p>
                                <p className="text-[9px] font-bold text-text-sub truncate">{moment.locationName}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link 
                        href={`/calendar?date=${log.dateKey}`}
                        className="px-6 py-3 bg-main-green text-white text-xs font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-main-green/20 flex items-center gap-2"
                      >
                        전체 기록 상세보기 <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-40 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center shadow-inner">
                <Calendar className="w-10 h-10 text-main-green opacity-20" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-text-main">아직 기록된 추억이 없습니다</h3>
                <p className="text-text-sub font-bold mt-2">오늘 아이와 어떤 하루를 보내셨나요?</p>
              </div>
              <Link href="/calendar" className="px-8 py-4 bg-main-green text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all">첫 기록 남기기</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
