'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, ChevronRight, Search, Filter } from 'lucide-react';
import { useDiary } from '@/app/common/hooks/useDiary';

export default function RecordPage() {
  const { allEntries } = useDiary();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-border p-6 lg:p-10 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-black text-main-green tracking-widest uppercase mb-1 block">Memory Archives</span>
            <h1 className="text-3xl lg:text-4xl font-black text-text-main tracking-tight">우리 아이 추억 저장소</h1>
            <p className="text-text-sub text-sm lg:text-base font-bold mt-2">지금까지 {allEntries.length}개의 소중한 순간이 기록되었습니다.</p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-main-yellow transition-colors" />
              <input 
                type="text" 
                placeholder="추억 검색하기..."
                className="pl-11 pr-4 py-3 bg-light-yellow/30 border border-main-yellow/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-main-yellow/20 focus:bg-white transition-all w-full md:w-64 font-bold"
              />
            </div>
            <button className="p-3 bg-white border border-border rounded-2xl text-text-sub hover:text-main-yellow hover:border-main-yellow/30 transition-all shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-6">
          {allEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-light-yellow rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-main-yellow" />
              </div>
              <h3 className="text-xl font-black text-text-main">아직 기록이 없어요</h3>
              <p className="text-text-sub mt-2 font-medium">달력에서 아이와의 추억을 남겨보세요!</p>
              <Link 
                href="/calendar" 
                className="mt-8 px-8 py-4 bg-main-yellow text-white font-black rounded-2xl shadow-lg shadow-main-yellow/30 hover:scale-105 active:scale-95 transition-all"
              >
                달력으로 이동하기
              </Link>
            </div>
          ) : (
            allEntries.map((entry) => (
              <div key={entry.dateKey} className="group bg-white rounded-[32px] border border-border overflow-hidden shadow-sm hover:shadow-xl hover:shadow-main-yellow/5 transition-all duration-300">
                <div className="flex flex-col md:flex-row">
                  {/* Photo Section */}
                  <div className="relative w-full md:w-72 aspect-[4/3] md:aspect-square overflow-hidden shrink-0">
                    <Image 
                      src={entry.photos[0] || '/api/placeholder/400/400'} 
                      alt={entry.title} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-main-green text-[10px] font-black rounded-full shadow-sm">
                        {entry.category}
                      </span>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[11px] font-black text-main-yellow tracking-widest uppercase">
                          <Calendar className="w-3 h-3" />
                          {entry.dateKey}
                        </div>
                        {entry.ai_status === 'DONE' && (
                          <span className="px-2 py-0.5 bg-light-green text-main-green text-[10px] font-black rounded-full">AI VERIFIED</span>
                        )}
                      </div>
                      <h3 className="text-xl lg:text-2xl font-black text-text-main mb-3 group-hover:text-main-yellow transition-colors leading-tight">
                        {entry.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-text-sub text-xs font-bold mb-4">
                        <MapPin className="w-3.5 h-3.5 text-main-yellow" />
                        {entry.location}
                      </div>
                      <p className="text-text-main/70 text-sm lg:text-base font-medium line-clamp-2 italic mb-6">
                        &quot;{entry.content}&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-2">
                        {entry.tags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[10px] font-bold text-text-sub bg-background px-2 py-1 rounded-lg border border-border">
                            #{tag}
                          </span>
                        ))}
                        {entry.tags && entry.tags.length > 3 && (
                          <span className="text-[10px] font-bold text-text-sub/50 flex items-center">
                            +{entry.tags.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <Link 
                        href={`/calendar?date=${entry.dateKey}`}
                        className="flex items-center gap-1 text-sm font-black text-main-yellow hover:gap-2 transition-all"
                      >
                        자세히 보기 <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
