'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Heart, MessageCircle, MapPin } from 'lucide-react';
import { useDiary } from '@/app/common/hooks/useDiary';

export default function TimelinePage() {
  const { allEntries } = useDiary();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
      {/* Header */}
      <div className="p-6 lg:p-10 border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div>
            <span className="text-xs font-black text-main-yellow tracking-widest uppercase mb-1 block">Visual Journey</span>
            <h1 className="text-3xl lg:text-4xl font-black text-text-main tracking-tight">추억 타임라인</h1>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-white overflow-hidden shadow-sm">
                  <Image src={`/dog-profile.png`} alt="Friend" width={40} height={40} />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-4 border-white bg-light-yellow flex items-center justify-center text-[10px] font-black text-main-yellow shadow-sm">
                +12
              </div>
            </div>
            <span className="text-xs font-bold text-text-sub">오늘도 12명의 친구들이 일기를 썼어요!</span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 bg-surface-green/30">
        <div className="max-w-6xl mx-auto">
          {allEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 bg-light-green rounded-full flex items-center justify-center mb-8 shadow-inner">
                <Heart className="w-12 h-12 text-main-green" />
              </div>
              <h3 className="text-2xl font-black text-text-main mb-3">소중한 순간을 채워주세요</h3>
              <p className="text-text-sub max-w-xs mx-auto leading-relaxed">
                아이와 함께한 오늘의 한 줄, 한 장의 사진이 모여<br/>세상에 하나뿐인 성장 기록이 됩니다.
              </p>
              <Link 
                href="/calendar" 
                className="mt-10 px-10 py-4 bg-main-green text-white font-black rounded-2xl shadow-xl shadow-main-green/20 hover:scale-105 active:scale-95 transition-all"
              >
                첫 기록 남기기
              </Link>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {allEntries.map((entry) => (
                <div 
                  key={entry.dateKey} 
                  className="break-inside-avoid bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-border group"
                >
                  <Link href={`/calendar?date=${entry.dateKey}`} className="block relative">
                    {/* Main Image */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image 
                        src={entry.photos[0] || '/api/placeholder/400/500'} 
                        alt={entry.title} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Date Badge */}
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-sm flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-main-yellow" />
                        <span className="text-[10px] font-black text-text-main">{entry.dateKey.split('-').slice(1).join('.')}</span>
                      </div>
                      
                      {/* Overlay on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <div className="flex items-center gap-4 text-white">
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4 fill-white" />
                            <span className="text-xs font-black">24</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4 fill-white" />
                            <span className="text-xs font-black">5</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-1.5 text-main-green text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-main-green" />
                        {entry.category}
                      </div>
                      <h3 className="text-base font-black text-text-main leading-tight line-clamp-2">
                        {entry.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-text-sub font-bold italic">
                        <MapPin className="w-3 h-3 text-main-yellow" />
                        {entry.location}
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {entry.tags?.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-[9px] font-bold text-text-sub/60 bg-surface-green px-2 py-1 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
