'use client';

import React, { useState } from 'react';
import { MapPin, Search, Navigation, Layers, ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import { useDiary, DiaryEntry } from '@/app/common/hooks/useDiary';
import Image from 'next/image';
import Link from 'next/link';

export default function MapPage() {
  const { allEntries } = useDiary();
  const [selectedLocation, setSelectedLocation] = useState<DiaryEntry | null>(null);

  // Filter entries that have location data
  const entriesWithLocation = allEntries.filter(e => e.location);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white relative overflow-hidden">
      {/* Mock Map Background */}
      <div className="absolute inset-0 bg-surface-green/50 overflow-hidden">
        {/* Simple mock map grid/pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#7DBE7A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Mock Landmarks */}
        <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-main-green/10 rounded-full blur-2xl" />
        <div className="absolute bottom-[30%] right-[20%] w-48 h-48 bg-main-yellow/10 rounded-full blur-3xl" />
        <div className="absolute top-[50%] left-[60%] w-40 h-40 bg-blue-500/5 rounded-full blur-2xl" />

        {/* Footprint Markers */}
        {entriesWithLocation.map((entry, i) => {
          // Mocking coordinates based on index for visual distribution
          const top = `${20 + (i * 15) % 60}%`;
          const left = `${20 + (i * 25) % 60}%`;
          
          return (
            <button 
              key={entry.dateKey}
              onClick={() => setSelectedLocation(entry)}
              className="absolute transition-all hover:scale-110 z-10 group"
              style={{ top, left }}
            >
              <div className="relative">
                {/* Pulse Effect */}
                <div className="absolute -inset-4 bg-main-yellow/20 rounded-full animate-ping group-hover:bg-main-yellow/40" />
                
                {/* Marker */}
                <div className={`relative flex flex-col items-center gap-1 transition-all ${selectedLocation?.dateKey === entry.dateKey ? 'scale-125 z-20' : ''}`}>
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xl border-2 border-main-yellow overflow-hidden">
                    <Image 
                      src={entry.photos[0] || '/api/placeholder/100/100'} 
                      alt={entry.location} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                  <div className="px-2 py-0.5 bg-white shadow-md rounded-full text-[9px] font-black text-text-main border border-border whitespace-nowrap">
                    {entry.location}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Map Controls */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub group-focus-within:text-main-yellow transition-colors" />
            <input 
              type="text" 
              placeholder="장소 검색..."
              className="pl-11 pr-4 py-3 bg-white/90 backdrop-blur-md border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-main-yellow/30 shadow-lg w-64 font-bold"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white/90 backdrop-blur-md border border-border rounded-2xl text-text-sub hover:text-main-yellow transition-all shadow-lg">
              <Layers className="w-5 h-5" />
            </button>
            <button className="p-3 bg-white/90 backdrop-blur-md border border-border rounded-2xl text-text-sub hover:text-main-yellow transition-all shadow-lg">
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
          <button className="p-3 bg-white/90 backdrop-blur-md border border-border rounded-2xl text-text-sub hover:text-main-yellow transition-all shadow-lg">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="p-3 bg-white/90 backdrop-blur-md border border-border rounded-2xl text-text-sub hover:text-main-yellow transition-all shadow-lg">
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Info Sheet */}
      {selectedLocation && (
        <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:w-96 animate-in slide-in-from-bottom duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl border border-border overflow-hidden">
            <div className="relative h-48">
              <Image 
                src={selectedLocation.photos[0] || '/api/placeholder/400/300'} 
                alt={selectedLocation.title} 
                fill 
                className="object-cover"
              />
              <button 
                onClick={() => setSelectedLocation(null)}
                className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/50 transition-all"
              >
                <ZoomOut className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-light-green text-main-green text-[10px] font-black rounded-full uppercase">
                  {selectedLocation.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-text-sub">
                  <Calendar className="w-3 h-3" /> {selectedLocation.dateKey}
                </span>
              </div>
              <h3 className="text-xl font-black text-text-main mb-1">{selectedLocation.title}</h3>
              <div className="flex items-center gap-1 text-xs font-bold text-main-yellow mb-4">
                <MapPin className="w-3 h-3" /> {selectedLocation.location}
              </div>
              <p className="text-text-sub text-sm line-clamp-2 italic mb-6">&quot;{selectedLocation.content}&quot;</p>
              
              <Link 
                href={`/calendar?date=${selectedLocation.dateKey}`}
                className="w-full flex items-center justify-center py-4 bg-main-yellow text-white font-black rounded-2xl shadow-lg shadow-main-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                추억 기록 보기
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating Summary Card (if nothing selected) */}
      {!selectedLocation && (
        <div className="absolute bottom-6 left-6 animate-in fade-in slide-in-from-left duration-500">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-[28px] shadow-xl border border-border">
            <h4 className="text-sm font-black text-text-main mb-1">우리 아이 활동 구역</h4>
            <p className="text-xs font-bold text-text-sub">최근 한 달 동안 <span className="text-main-green">5곳</span>의 새로운 장소를 방문했어요!</p>
          </div>
        </div>
      )}
    </div>
  );
}
