'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  Image as ImageIcon, 
  MapPin, 
  Book, 
  Plus,
  Sparkles,
  Zap,
  ChevronRight,
  TrendingUp,
  Heart,
  User
} from 'lucide-react';
import { useDiary } from '@/app/common/hooks/useDiary';
import { usePet } from '@/app/common/hooks/usePet';
import { useInventory } from '@/app/common/hooks/useInventory';

export default function DashboardPage() {
  const { allEntries } = useDiary();
  const { pets } = usePet();
  const { items } = useInventory();

  const recentEntry = allEntries[0];
  const primaryPet = pets[0];

  const stats = [
    { label: '함께한 추억', value: allEntries.length, unit: '개', icon: Calendar, color: 'text-main-yellow', bg: 'bg-light-yellow' },
    { label: '우리 아이들', value: pets.length, unit: '마리', icon: Users, color: 'text-main-green', bg: 'bg-light-green' },
    { label: '보물창고', value: items.length, unit: '개', icon: Book, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-y-auto no-scrollbar">
      {/* Welcome Header */}
      <div className="bg-white border-b border-border p-6 lg:p-10 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-main-green/10">
              {primaryPet ? (
                <Image src={primaryPet.photo || '/dog-profile.png'} alt={primaryPet.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-light-yellow flex items-center justify-center">
                  <User className="w-10 h-10 text-main-yellow" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-main-green/10 text-main-green text-[10px] font-black rounded-full uppercase tracking-widest">Premium Log</span>
                <Sparkles className="w-3 h-3 text-main-yellow fill-main-yellow" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-text-main tracking-tight">
                {primaryPet ? `${primaryPet.name}와(과) 함께한 지 ${primaryPet.addedAt ? '7' : '1'}일째! ✨` : '반가워요! 아이를 등록해보세요.'}
              </h1>
              <p className="text-text-sub text-sm font-bold mt-1">오늘 하루, 아이와 어떤 추억을 만드셨나요?</p>
            </div>
          </div>
          
          <Link 
            href="/calendar"
            className="flex items-center gap-3 px-8 py-4 bg-main-yellow text-white font-black rounded-[24px] shadow-lg shadow-main-yellow/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" /> 새 기록 남기기
          </Link>
        </div>
      </div>

      <div className="p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] border border-border shadow-sm flex items-center gap-5 group hover:shadow-xl transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-text-sub uppercase tracking-widest mb-0.5">{stat.label}</div>
                  <div className="text-2xl font-black text-text-main">
                    {stat.value}<span className="text-sm font-bold ml-0.5">{stat.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Recent Memory */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-main-green" /> 최근 기록
                </h2>
                <Link href="/record" className="text-xs font-black text-text-sub hover:text-main-yellow transition-colors flex items-center gap-1">
                  전체보기 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentEntry ? (
                <div className="bg-white rounded-[40px] border border-border overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 group">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="relative w-full md:w-[45%] aspect-[4/3] md:aspect-auto overflow-hidden shrink-0">
                      <Image 
                        src={recentEntry.photos[0] || '/api/placeholder/400/400'} 
                        alt={recentEntry.title} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm">
                        <span className="text-xs font-black text-main-green">{recentEntry.dateKey}</span>
                      </div>
                    </div>
                    <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-light-yellow text-main-yellow text-[10px] font-black rounded-full uppercase tracking-wider">{recentEntry.category}</span>
                          <div className="flex items-center gap-1 text-amber-500 font-black text-[10px]">
                            <Zap className="w-3 h-3 fill-current" /> Lv.{recentEntry.energy_level}
                          </div>
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-black text-text-main mb-4 group-hover:text-main-yellow transition-colors leading-tight">
                          {recentEntry.title}
                        </h3>
                        <p className="text-text-main/70 text-base font-medium line-clamp-3 italic leading-relaxed">
                          &quot;{recentEntry.content}&quot;
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-text-sub">
                          <MapPin className="w-4 h-4 text-main-yellow" /> {recentEntry.location}
                        </div>
                        <Link 
                          href={`/calendar?date=${recentEntry.dateKey}`}
                          className="w-12 h-12 bg-surface-green rounded-full flex items-center justify-center text-main-green hover:bg-main-green hover:text-white transition-all shadow-inner"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[40px] border-2 border-dashed border-border p-20 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 bg-light-yellow rounded-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-main-yellow" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-text-main">아직 추억이 없어요</h3>
                    <p className="text-text-sub text-sm font-medium">우리 아이와의 첫 추억을 남겨볼까요?</p>
                  </div>
                  <Link href="/calendar" className="px-8 py-3 bg-main-yellow text-white font-black rounded-2xl shadow-lg">기록하기</Link>
                </div>
              )}
            </div>

            {/* Quick Links / Side Widget */}
            <div className="space-y-10">
              <div className="space-y-5">
                <h2 className="text-xl font-black text-text-main px-2">바로가기</h2>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: '추억 타임라인', href: '/timeline', icon: ImageIcon, desc: '성장 과정을 한눈에', color: 'bg-pink-50 text-pink-500' },
                    { label: '추억 지도', href: '/map', icon: MapPin, desc: '다녀온 발자국 확인', color: 'bg-blue-50 text-blue-500' },
                    { label: '가족 관리', href: '/family', icon: Heart, desc: '아이들 프로필 관리', color: 'bg-red-50 text-red-500' },
                  ].map((link, i) => (
                    <Link key={i} href={link.href} className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-x-1 transition-all group">
                      <div className={`w-12 h-12 rounded-2xl ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <link.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-text-main">{link.label}</div>
                        <div className="text-[10px] text-text-sub font-bold">{link.desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-border group-hover:text-text-main transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Tip Card */}
              <div className="bg-main-green p-8 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-main-green/20">
                <div className="relative z-10 space-y-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-black leading-tight">AI 팁: 산책하기 좋은 날!</h3>
                  <p className="text-white/80 text-sm font-medium leading-relaxed">
                    내일은 구름 한 점 없이 맑은 날씨가 예상돼요. {primaryPet?.name || '아이'}와 함께 근처 공원으로 산책을 나가는 건 어떨까요?
                  </p>
                </div>
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
