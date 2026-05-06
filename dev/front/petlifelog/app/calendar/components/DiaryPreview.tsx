'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Camera, Plus, Cloud, Sun, CloudRain, Zap, X, Sparkles, User } from 'lucide-react';

interface DiaryEntry {
  title: string;
  location: string;
  category: string;
  content: string;
  photos: string[];
  weather?: string;
  ai_status?: 'PROCESSING' | 'DONE';
  energy_level?: number;
  tags?: string[];
  dogs_detected?: string[];
}

interface DiaryPreviewProps {
  date: Date;
  entry?: DiaryEntry;
  events?: { title: string; event_type: string; memo?: string }[];
  isMobileDrawer?: boolean;
  onClose?: () => void;
  onRecord?: () => void;
  onEdit?: () => void;
}

const getWeatherIcon = (weather?: string) => {
  switch (weather) {
    case 'SUNNY': return <Sun className="w-5 h-5 text-amber-400" />;
    case 'CLOUDY': return <Cloud className="w-5 h-5 text-slate-400" />;
    case 'RAINY': return <CloudRain className="w-5 h-5 text-blue-400" />;
    default: return <Sun className="w-5 h-5 text-amber-400" />;
  }
};

export default function DiaryPreview({ 
  date, 
  entry, 
  events = [], 
  isMobileDrawer = false,
  onClose,
  onRecord,
  onEdit
}: DiaryPreviewProps) {
  const formattedDate = date.toLocaleDateString('ko-KR', { 
    month: 'long', 
    day: 'numeric', 
    weekday: 'short' 
  });

  const renderContent = () => (
    <div className={`p-6 lg:p-10 ${isMobileDrawer ? 'pb-24' : ''}`}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-main-yellow tracking-widest uppercase">Memory</span>
            {entry?.ai_status === 'PROCESSING' && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[9px] font-black rounded-full animate-pulse flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI WRITING...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-text-main tracking-tight">{formattedDate}</h3>
            {onClose && (
              <button onClick={onClose} className="lg:hidden p-1 text-text-sub hover:text-text-main">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
        {!entry && onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-text-sub hover:text-text-main">
            <X className="w-6 h-6" />
          </button>
        )}
        {entry && (
          <div className="flex items-center gap-2">
            <button 
              onClick={onEdit}
              className="px-3 py-1.5 bg-light-yellow text-main-yellow text-[11px] font-black rounded-lg hover:bg-main-yellow hover:text-white transition-all shadow-sm mr-2"
            >
              수정하기
            </button>
            {getWeatherIcon(entry.weather)}
          </div>
        )}
      </div>

      {!entry ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-24 h-24 bg-light-yellow rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Camera className="w-10 h-10 text-main-yellow" />
          </div>
          <h3 className="text-xl font-black text-text-main mb-3">{formattedDate}</h3>
          <p className="text-text-sub text-sm leading-relaxed mb-8">
            아직 기록된 추억이 없어요.<br/>아이와 어떤 하루를 보내셨나요?
          </p>
          <button 
            onClick={onRecord}
            className="flex items-center gap-2 px-8 py-4 bg-main-yellow text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-main-yellow/30"
          >
            <Plus className="w-5 h-5" /> 기록하기
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Photo Card */}
          <div className="relative aspect-[4/5] w-full rounded-[32px] overflow-hidden shadow-2xl shadow-black/10 group">
            <Image src={entry.photos[0]} alt="Main" fill className="object-cover transition-transform group-hover:scale-105 duration-700" />
            
            {/* AI Badges */}
            <div className="absolute top-6 left-6 flex flex-wrap gap-2 pr-6">
              <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-main-green text-[11px] font-black rounded-full shadow-sm">
                {entry.category}
              </span>
              {entry.energy_level && (
                <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-amber-500 text-[11px] font-black rounded-full shadow-sm flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" /> Lv.{entry.energy_level}
                </span>
              )}
            </div>

            {/* Detected Dogs Overlay */}
            {entry.dogs_detected && entry.dogs_detected.length > 0 && (
              <div className="absolute bottom-6 left-6 flex -space-x-2">
                {entry.dogs_detected.map((dog, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md border-2 border-white flex items-center justify-center shadow-lg group/dog relative overflow-hidden">
                    <User className="w-5 h-5 text-main-green" />
                    <div className="absolute inset-0 bg-main-green/80 opacity-0 group-hover/dog:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-black">
                      {dog}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xl lg:text-2xl font-black text-text-main leading-tight">{entry.title}</h4>
              <Sparkles className="w-4 h-4 text-main-yellow fill-main-yellow" />
            </div>
            
            <div className="flex items-center gap-1.5 text-text-sub text-xs font-bold mb-6">
              <MapPin className="w-3.5 h-3.5 text-main-yellow" />
              {entry.location}
            </div>
            
            <div className="relative p-6 bg-surface-green/50 rounded-[28px] border border-main-green/5">
              <div className="absolute -left-1 top-6 bottom-6 w-1 bg-main-green/20 rounded-full" />
              <p className="text-text-main/80 leading-relaxed text-[15px] lg:text-[16px] font-medium italic">
                &quot;{entry.content}&quot;
              </p>
            </div>
          </div>

          {entry.tags && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag, i) => (
                <span key={i} className="text-[11px] font-bold text-text-sub bg-background px-3 py-1.5 rounded-lg border border-border">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            {entry.photos.slice(0, 4).map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
                <Image src={photo} alt={`Photo ${i}`} fill className="object-cover transition-transform group-hover:scale-110" />
                {i === 3 && entry.photos.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white text-xs font-black">
                    +{entry.photos.length - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h4 className="text-xs font-black text-main-green tracking-widest uppercase mb-4">오늘의 일정</h4>
          <div className="space-y-3">
            {events.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-light-green/50 rounded-xl">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-lg">
                  {ev.event_type === 'BIRTHDAY' ? '🎂' : ev.event_type === 'VACCINE' ? '💉' : '📅'}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-main">{ev.title}</div>
                  <div className="text-[10px] text-text-sub">{ev.memo || '반려견을 위한 특별한 날'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (isMobileDrawer) {
    return (
      <div className="fixed inset-0 z-[110] bg-white overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-[420px] bg-white overflow-y-auto min-h-0 max-h-full shadow-[-8px_0_24px_rgba(0,0,0,0.02)] no-scrollbar">
      {renderContent()}
    </div>
  );
}
