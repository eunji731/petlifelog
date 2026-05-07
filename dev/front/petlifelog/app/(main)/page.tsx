'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, 
  Heart, 
  Sparkles, 
  Zap, 
  MessageCircle, 
  ChevronRight, 
  Plus,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { useDiary } from '@/app/common/hooks/useDiary';
import { usePet } from '@/app/common/hooks/usePet';
import { useInventory } from '@/app/common/hooks/useInventory';
import { getImagePath } from '@/app/common/lib/clientApi';

export default function DashboardPage() {
  const { allLogs } = useDiary();
  const { pets } = usePet();
  const { items } = useInventory();

  const primaryPet = pets[0];
  const recentLog = allLogs[0];
  const stats = [
    { label: '함께한 날', value: primaryPet ? '128일' : '0일', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: '기록된 추억', value: `${allLogs.length}개`, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: '수집한 아이템', value: `${items.length}개`, icon: Sparkles, color: 'text-main-yellow', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-y-auto no-scrollbar p-6 lg:p-10">
      <div className="max-w-5xl mx-auto w-full space-y-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 lg:p-12 rounded-[40px] border border-border shadow-sm">
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-main-green/10">
              {primaryPet ? (
                <Image src={getImagePath(primaryPet.photo, 'profiles')} alt={primaryPet.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-green flex items-center justify-center">
                  <Plus className="w-8 h-8 text-main-green" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-black text-text-main tracking-tight">
                {primaryPet ? `${primaryPet.name}와 함께하는` : '반려동물과 함께하는'} <br/>
                <span className="text-main-green">특별한 일상</span>을 기록하세요!
              </h1>
              <p className="text-sm font-bold text-text-sub">AI가 아이의 시선으로 소중한 순간을 정리해 드립니다.</p>
            </div>
          </div>
          <Link 
            href="/calendar" 
            className="px-8 py-4 bg-main-green text-white font-black rounded-2xl shadow-lg shadow-main-green/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            기록 시작하기 <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 lg:p-8 rounded-[32px] border border-border shadow-sm flex items-center gap-6 hover:shadow-md transition-all group">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-black text-text-sub uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-text-main mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content: Recent Memory & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Recent Memory Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-main-yellow fill-main-yellow" /> 최근 기록된 추억
              </h2>
              <Link href="/calendar" className="text-xs font-black text-main-green hover:underline">전체 보기</Link>
            </div>

            {recentLog ? (
              <div className="bg-white rounded-[40px] overflow-hidden border border-border shadow-sm group">
                <div className="relative h-64 lg:h-80 overflow-hidden">
                  <Image 
                    src={getImagePath(recentLog.representativePhotoPath)} 
                    alt="Recent" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-main-green shadow-lg">
                    {recentLog.dateKey}
                  </div>
                  <div className="absolute bottom-8 left-8 right-8 text-white space-y-2">
                    <h3 className="text-2xl lg:text-3xl font-black leading-tight">{recentLog.aiTitle}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold opacity-90">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {recentLog.moments[0]?.locationName || '어딘가'}</span>
                      <span className="w-1 h-1 bg-white rounded-full" />
                      <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 fill-current text-main-yellow" /> 에너제틱</span>
                    </div>
                  </div>
                </div>
                <div className="p-8 lg:p-10">
                  <p className="text-lg font-medium text-text-main leading-relaxed italic line-clamp-3">
                    &quot;{recentLog.aiSummary}&quot;
                  </p>
                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {recentLog.moments.slice(0, 3).map((m, i) => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden shadow-sm relative">
                          <Image src={getImagePath(m.photos[0]?.path)} alt="Pet" fill className="object-cover" />
                        </div>
                      ))}
                      {recentLog.moments.length > 3 && (
                        <div className="w-12 h-12 rounded-full border-4 border-white bg-surface-green flex items-center justify-center text-[10px] font-black text-text-sub shadow-sm">
                          +{recentLog.moments.length - 3}
                        </div>
                      )}
                    </div>
                    <Link 
                      href={`/calendar?date=${recentLog.dateKey}`}
                      className="px-6 py-3 bg-surface-green text-main-green text-sm font-black rounded-xl hover:bg-main-green hover:text-white transition-all shadow-sm"
                    >
                      상세 모멘트 보기
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] border-2 border-dashed border-border p-20 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-surface-green rounded-full flex items-center justify-center">
                  <Plus className="w-10 h-10 text-main-green opacity-40" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-text-main">아직 기록이 없어요</h3>
                  <p className="text-text-sub font-bold mt-2">아이와의 소중한 순간들을 기록해 보세요!</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Insights Card */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-text-main flex items-center gap-2 px-4">
              <TrendingUp className="w-5 h-5 text-deep-green" /> AI 성장 분석
            </h2>
            <div className="bg-deep-green rounded-[40px] p-8 lg:p-10 text-white shadow-xl relative overflow-hidden h-[500px]">
              <div className="relative z-10 h-full flex flex-col">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Sparkles className="w-6 h-6 text-main-yellow fill-main-yellow" />
                  </div>
                  <h3 className="text-xl font-black">AI 봉봉 분석 보고서</h3>
                </div>
                
                <div className="flex-1 flex flex-col justify-center space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black opacity-60 uppercase tracking-widest">Social Level</span>
                      <span className="text-xl font-black">85%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-main-yellow w-[85%] rounded-full shadow-[0_0_12px_rgba(255,212,90,0.5)]" />
                    </div>
                    <p className="text-xs font-bold opacity-80 leading-relaxed">최근 산책에서 친구 강아지들을 만났을 때 반응이 매우 긍정적이었어요!</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black opacity-60 uppercase tracking-widest">Happiness</span>
                      <span className="text-xl font-black">92%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-main-green w-[92%] rounded-full shadow-[0_0_12px_rgba(125,190,122,0.5)]" />
                    </div>
                    <p className="text-xs font-bold opacity-80 leading-relaxed">좋아하는 간식과 충분한 산책 덕분에 행복 지수가 최고치를 기록 중입니다.</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 opacity-60" />
                    <p className="text-[11px] font-bold italic opacity-70">
                      &quot;봉봉이는 지금 아주 건강하고 행복한 상태예요!&quot;
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-main-green/10 rounded-full blur-3xl" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
