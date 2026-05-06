'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, MapPin, Tag, Sun, Cloud, CloudRain, Zap, Plus, Trash2, Sparkles, Check, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/app/common/hooks/useToast';
import { usePet } from '@/app/common/hooks/usePet';

interface DiaryEntryData {
  title: string;
  location: string;
  category: string;
  content: string;
  photos: string[];
  weather?: string;
  energy_level?: number;
  tags?: string[];
  dogs_detected?: string[];
}

interface DiaryEditorProps {
  date: Date;
  initialData?: DiaryEntryData;
  onSave: (data: DiaryEntryData) => void;
  onCancel: () => void;
  isMobile?: boolean;
}

export default function DiaryEditor({
  date,
  initialData,
  onSave,
  onCancel,
  isMobile = false
}: DiaryEditorProps) {
  const { pets } = usePet();
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [category, setCategory] = useState(initialData?.category || 'GENERAL');
  const [weather, setWeather] = useState(initialData?.weather || 'SUNNY');
  const [energyLevel, setEnergyLevel] = useState(initialData?.energy_level || 3);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [dogsDetected, setDogsDetected] = useState<string[]>(initialData?.dogs_detected || []);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(!!initialData);
  const [retryCount, setRetryCount] = useState(0);
  const [newTag, setNewTag] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { info, warning } = useToast();

  const formattedDate = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPhotoUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newPhotoUrls]);
    }
    e.target.value = '';
  };

  const triggerAIAnalysis = (isRetry = false) => {
    if (isRetry && retryCount >= 3) {
      warning('AI 재작성은 최대 3회까지만 가능해요.');
      return;
    }

    if (dogsDetected.length === 0) {
      warning('기록에 참여한 아이들을 최소 한 마리 이상 선택해 주세요.');
      return;
    }

    setIsAnalyzing(true);
    info(isRetry ? 'AI가 일기를 다시 쓰고 있어요...' : 'AI가 사진과 태그를 분석 중이에요...');

    // Simulate GPT Vision & Text Analysis using Pet Context
    setTimeout(() => {
      const selectedPets = pets.filter(p => dogsDetected.includes(p.name));
      const petNames = selectedPets.map(p => p.name).join(', ');
      const retryPrefix = isRetry ? `[재작성 ${retryCount + 1}] ` : '';
      
      // Personalization logic based on gender and traits
      const firstPet = selectedPets[0];
      const genderSuffix = firstPet?.gender === 'MALE' ? '왕자님' : '공주님';
      
      setTitle(retryPrefix + `${petNames} ${genderSuffix}와 함께한 특별한 하루!`);
      setContent(`${retryPrefix}${petNames}이(가) 오늘따라 정말 즐거워 보였어요. ${firstPet?.traits || ''} 특히 선택하신 사진 속의 밝은 표정은 보는 사람까지 행복하게 만드네요. 우리 ${firstPet?.name}의 매력이 잘 드러난 것 같아 더욱 소중한 기록이 될 것 같습니다.`);
      setCategory('ACTIVITY');
      setWeather('SUNNY');
      setEnergyLevel(5);
      
      const aiTags = ['행복한시간', '성공적'];
      const mergedTags = Array.from(new Set([...tags, ...aiTags]));
      setTags(mergedTags);
      
      setLocation('어느 멋진 장소');
      setIsAnalyzing(false);
      setIsAnalyzed(true);
      if (isRetry) setRetryCount(prev => prev + 1);
    }, 2000);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex flex-col h-full bg-white ${isMobile ? 'fixed inset-0 z-[120]' : 'w-[420px] shadow-[-8px_0_24px_rgba(0,0,0,0.02)]'}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border p-6 flex justify-between items-center">
        <div>
          <span className="text-xs font-black text-main-yellow tracking-widest uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 fill-main-yellow" />
            {initialData ? 'Memory Verified' : 'AI-Powered Archive'}
          </span>
          <h3 className="text-xl font-black text-text-main tracking-tight">{formattedDate}</h3>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-light-yellow rounded-xl transition-colors"
        >
          <X className="w-6 h-6 text-text-sub" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 no-scrollbar">
        {/* 1. Photo Upload */}
        <div className="space-y-4">
          <label className="text-sm font-black text-text-main flex items-center gap-2">
            <Camera className="w-4 h-4 text-main-yellow" /> 사진 등록 ({photos.length})
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept="image/*"
              onChange={handleFileChange}
            />
            <button 
              onClick={handlePhotoClick}
              className="flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-main-yellow/30 bg-light-yellow/30 flex flex-col items-center justify-center gap-1 text-main-yellow hover:bg-light-yellow transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[10px] font-bold">사진 추가</span>
            </button>
            {photos.map((photo, i) => (
              <div key={i} className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden group shadow-sm">
                <Image src={photo} alt={`Upload ${i}`} fill className="object-cover" />
                <button 
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Participated Dogs */}
        <div className="space-y-3">
          <label className="text-sm font-black text-text-main flex items-center gap-2">
            👥 참여한 아이들
          </label>
          <div className="flex flex-wrap gap-3">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => {
                  if (dogsDetected.includes(pet.name)) {
                    setDogsDetected(dogsDetected.filter(d => d !== pet.name));
                  } else {
                    setDogsDetected([...dogsDetected, pet.name]);
                  }
                }}
                className={`flex flex-col items-center gap-2 p-1 rounded-2xl transition-all ${
                  dogsDetected.includes(pet.name) ? 'scale-105' : 'opacity-60 grayscale-[50%]'
                }`}
              >
                <div className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                  dogsDetected.includes(pet.name) ? 'border-main-green ring-4 ring-main-green/10' : 'border-transparent'
                }`}>
                  <Image src={pet.photo || '/dog-profile.png'} alt={pet.name} fill className="object-cover" />
                  <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border border-white flex items-center justify-center shadow-sm ${pet.gender === 'MALE' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                    <span className="text-[8px] font-black text-white">{pet.gender === 'MALE' ? '♂' : '♀'}</span>
                  </div>
                  {dogsDetected.includes(pet.name) && (
                    <div className="absolute inset-0 bg-main-green/10 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-black ${dogsDetected.includes(pet.name) ? 'text-main-green' : 'text-text-sub'}`}>
                  {pet.name}
                </span>
              </button>
            ))}
            {pets.length === 0 && (
              <p className="text-[10px] text-text-sub font-bold italic">등록된 반려견이 없습니다. 가족 관리에서 등록해 주세요!</p>
            )}
          </div>
        </div>

        {/* 3. User Tags (Optional) */}
        <div className="space-y-3">
          <label className="text-sm font-black text-text-main flex items-center gap-2">
            <Tag className="w-4 h-4 text-main-yellow" /> 태그 (선택사항)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1 text-[11px] font-bold text-main-green bg-light-green px-3 py-1.5 rounded-lg border border-main-green/10 shadow-sm">
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-deep-green p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="태그를 입력해 주세요."
              className="flex-1 px-4 py-2 bg-background border border-border rounded-xl focus:outline-none text-xs font-medium shadow-sm"
            />
            <button 
              onClick={handleAddTag}
              className="px-4 py-2 bg-light-green text-main-green font-black rounded-xl text-xs hover:bg-main-green hover:text-white transition-all shadow-sm"
            >
              추가
            </button>
          </div>
        </div>

        {/* 4. AI Generation Button & Result */}
        <div className="pt-4 border-t border-border space-y-6">
          {!isAnalyzed ? (
            <button
              onClick={() => triggerAIAnalysis(false)}
              disabled={isAnalyzing || photos.length === 0 || dogsDetected.length === 0}
              className="w-full py-6 bg-main-yellow text-white font-black rounded-[28px] shadow-xl shadow-main-yellow/20 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>AI가 추억을 분석하며 일기를 쓰는 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 fill-white" />
                  <span>AI 일기 작성하기</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* AI Bindings Result */}
              <div className="space-y-6 bg-light-yellow/10 p-5 rounded-[28px] border border-main-yellow/10">
                <div className="space-y-2">
                  <label className="text-sm font-black text-text-main flex items-center justify-between">
                    <span>✨ AI 한줄 평</span>
                  </label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-yellow/30 focus:border-main-yellow transition-all text-sm font-bold shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-text-main flex items-center justify-between">
                    <span>📝 AI가 쓴 일기</span>
                  </label>
                  <textarea 
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-main-yellow/30 focus:border-main-yellow transition-all text-sm font-medium resize-none shadow-sm leading-relaxed"
                  />
                </div>
              </div>

              {/* Bound Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-text-main">활동 종류</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold appearance-none shadow-sm"
                  >
                    <option value="ACTIVITY">산책/활동</option>
                    <option value="GENERAL">일상/기록</option>
                    <option value="OBJECT">간식/장난감</option>
                    <option value="HEALTH">건강/병원</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-text-main">날씨</label>
                  <div className="flex bg-background border border-border rounded-xl p-1 gap-1 shadow-sm">
                    {['SUNNY', 'CLOUDY', 'RAINY'].map((w) => (
                      <button
                        key={w}
                        onClick={() => setWeather(w)}
                        className={`flex-1 py-2 flex items-center justify-center rounded-lg transition-all ${weather === w ? 'bg-main-yellow text-white shadow-sm' : 'text-text-sub'}`}
                      >
                        {w === 'SUNNY' && <Sun className="w-4 h-4" />}
                        {w === 'CLOUDY' && <Cloud className="w-4 h-4" />}
                        {w === 'RAINY' && <CloudRain className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Energy & Location */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-black text-text-main flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500 fill-current" /> 에너지 상태
                    </label>
                    <span className="text-xs font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Lv.{energyLevel}</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-light-yellow rounded-lg appearance-none cursor-pointer accent-main-yellow"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-text-main flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-main-yellow" /> 장소
                  </label>
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold shadow-sm"
                  />
                </div>
              </div>

              {/* Regeneration Button */}
              <div className="pt-4 border-t border-border space-y-3">
                <button
                  onClick={() => triggerAIAnalysis(true)}
                  disabled={isAnalyzing || retryCount >= 3}
                  className="w-full py-4 bg-white border-2 border-main-yellow text-main-yellow font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-main-yellow hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-main-yellow"
                >
                  <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  AI 일기 재작성 ({retryCount}/3)
                </button>
                <p className="text-[10px] text-center text-text-sub font-bold">
                  * 일기 내용이 마음에 들지 않나요? AI가 다시 써드릴게요. (최대 3회)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 lg:p-10 border-t border-border bg-white/80 backdrop-blur-md flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 py-4 bg-background border border-border text-text-sub font-black rounded-2xl hover:bg-border transition-all shadow-sm"
        >
          취소
        </button>
        <button 
          onClick={() => onSave({ title, content, location, category, weather, energy_level: energyLevel, tags, photos, dogs_detected: dogsDetected })}
          disabled={!isAnalyzed || isAnalyzing}
          className="flex-[2] py-4 bg-main-yellow text-white font-black rounded-2xl shadow-lg shadow-main-yellow/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          저장하기
        </button>
      </div>
    </div>
  );
}
