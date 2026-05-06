'use client';

import React, { useState } from 'react';
import { MapPin, Search, Navigation, Layers, ZoomIn, ZoomOut, Calendar, Zap, Sparkles, X } from 'lucide-react';
import { useDiary, Moment } from '@/app/common/hooks/useDiary';
import Image from 'next/image';
import Link from 'next/link';

interface ExtendedMoment extends Moment {
  dateKey: string;
}

export default function MapPage() {
  const { allLogs } = useDiary();
  const [selectedMoment, setSelectedMoment] = useState<ExtendedMoment | null>(null);

  // Flatten all moments from all logs and filter those with location data
  const momentsWithLocation: ExtendedMoment[] = allLogs.flatMap(log => 
    log.moments.map(moment => ({
      ...moment,
      dateKey: log.dateKey
    }))
  ).filter(m => m.locationName);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white relative overflow-hidden">
      {/* Mock Map Background */}
      <div className="absolute inset-0 bg-surface-green/50 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#7DBE7A 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Mock Landmarks */}
        <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-main-green/10 rounded-full blur-2xl" />
        <div className="absolute bottom-[30%] right-[20%] w-48 h-48 bg-main-yellow/10 rounded-full blur-3xl" />
        <div className="absolute top-[50%] left-[60%] w-40 h-40 bg-blue-500/5 rounded-full blur-2xl" />

        {/* Mock Pins from Moments */}
        <div className="relative w-full h-full p-20">
          {momentsWithLocation.map((moment, i) => (
            <button
              key={`${moment.id}-${i}`}
              onClick={() => setSelectedMoment(moment)}
              className="absolute group transition-transform hover:scale-110 active:scale-90"
              style={{
                top: `${20 + (i * 15) % 60}%`,
                left: `${15 + (i * 25) % 70}%`
              }}
            >
              <div className="relative">
                <MapPin className={`w-10 h-10 ${selectedMoment?.id === moment.id ? 'text-main-green' : 'text-main-yellow'} fill-current drop-shadow-lg`} />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm ring-2 ring-main-yellow/20">
                  <Image src={moment.photos[0]?.path || '/dog-profile.png'} alt="Pet" fill className="object-cover" />
                </div>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-text-main text-white text-[10px] font-black rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                {moment.locationName}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute top-6 left-6 right-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
          <input 
            type="text" 
            placeholder="장소나 추억을 검색해 보세요..."
            className="w-full pl-11 pr-4 py-4 bg-white/90 backdrop-blur-md border border-white rounded-[24px] shadow-2xl shadow-main-green/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main-green/20 transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          <button className="p-4 bg-white/90 backdrop-blur-md border border-white rounded-2xl shadow-xl text-text-main hover:bg-main-green hover:text-white transition-all">
            <Navigation className="w-5 h-5" />
          </button>
          <button className="p-4 bg-white/90 backdrop-blur-md border border-white rounded-2xl shadow-xl text-text-main hover:bg-main-green hover:text-white transition-all">
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button className="p-3 bg-white border border-border rounded-xl shadow-lg text-text-main hover:bg-surface-green transition-all"><ZoomIn className="w-5 h-5" /></button>
        <button className="p-3 bg-white border border-border rounded-xl shadow-lg text-text-main hover:bg-surface-green transition-all"><ZoomOut className="w-5 h-5" /></button>
      </div>

      {/* Selected Location Detail Overlay */}
      {selectedMoment && (
        <div className="absolute bottom-8 left-6 right-6 md:left-auto md:right-8 md:w-[400px] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-border ring-1 ring-black/5">
            <div className="relative h-48">
              <Image src={selectedMoment.photos[0]?.path || '/dog-profile.png'} alt="Location" fill className="object-cover" />
              <button 
                onClick={() => setSelectedMoment(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4 flex gap-1.5">
                <span className="px-2.5 py-1 bg-main-green text-white text-[9px] font-black rounded-full shadow-lg uppercase tracking-widest">
                  {selectedMoment.category}
                </span>
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-text-main text-[9px] font-black rounded-full shadow-lg">
                  {selectedMoment.dateKey}
                </span>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-text-main tracking-tight">{selectedMoment.locationName}</h3>
                <p className="text-sm font-bold text-text-sub flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-main-yellow fill-main-yellow" /> {selectedMoment.aiTitle}
                </p>
              </div>
              
              <div className="bg-surface-green/50 p-4 rounded-2xl border border-main-green/5 italic text-sm font-medium text-text-main/80 leading-relaxed line-clamp-3">
                &quot;{selectedMoment.aiContent}&quot;
              </div>

              <div className="flex gap-2">
                <Link 
                  href={`/calendar?date=${selectedMoment.dateKey}`}
                  className="flex-1 py-3.5 bg-main-green text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-main-green/20"
                >
                  <Calendar className="w-3.5 h-3.5" /> 전체 일기 보기
                </Link>
                <button className="w-14 py-3.5 bg-surface-green text-text-main rounded-xl flex items-center justify-center hover:bg-border transition-all">
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
