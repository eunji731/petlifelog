'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Plus, Trash2, Sparkles, Check, RefreshCw, Calendar, MapPin, Zap } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/app/common/hooks/useToast';
import { usePet } from '@/app/common/hooks/usePet';
import { DailyLog, Moment } from '@/app/common/hooks/useDiary';

interface DiaryEditorProps {
  date: Date;
  initialData?: DailyLog;
  onSave: (data: DailyLog) => void;
  onCancel: () => void;
}

export default function DiaryEditor({
  date,
  initialData,
  onSave,
  onCancel
}: DiaryEditorProps) {
  const { pets } = usePet();
  const { info, warning, success } = useToast();
  
  // State for batch upload
  const [photos, setPhotos] = useState<string[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);
  
  // State for AI Result (Hierarchical)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<DailyLog | null>(initialData || null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedDate = date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newUrls]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !userTags.includes(newTag.trim())) {
      setUserTags([...userTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const triggerBatchAIAnalysis = () => {
    if (photos.length === 0) {
      warning('분석할 사진을 최소 1장 이상 등록해 주세요.');
      return;
    }
    if (selectedDogIds.length === 0) {
      warning('사진 속 주인공들을 선택해 주세요.');
      return;
    }

    setIsAnalyzing(true);
    info('AI가 사진들을 분석하여 모멘트를 나누고 일기를 쓰고 있어요...');

    // Simulate AI Multi-Step Generation
    setTimeout(() => {
      const dateKey = date.toISOString().split('T')[0];
      const selectedPets = pets.filter(p => selectedDogIds.includes(p.id));
      const petNames = selectedPets.map(p => p.name).join(', ');

      const mockResult: DailyLog = {
        id: Math.random().toString(36).substr(2, 9),
        dateKey,
        aiTitle: `${petNames}와(과) 함께한 다채로운 하루 ✨`,
        aiSummary: `오늘은 ${petNames}와(과) 병원도 가고 공원 산책도 하면서 바쁜 시간을 보냈어요. 상황별로 아이들의 반응이 달랐지만 전체적으로 행복한 하루였습니다.`,
        representativePhotoPath: photos[0],
        moments: [
          {
            id: 'm1',
            category: 'HEALTH',
            locationName: '튼튼동물병원',
            aiTitle: '무서웠던 병원 방문 ㅠㅠ',
            aiContent: `아침 일찍 병원에 다녀왔어요. ${selectedPets[0]?.traits || ''} 평소처럼 씩씩하려고 했지만 주사기는 역시 무서웠나 봐요.`,
            energyLevel: 2,
            photos: [{ id: 'p1', path: photos[photos.length - 1] }],
            tags: ['정기검진', '무서워'],
            dogIds: selectedDogIds
          },
          {
            id: 'm2',
            category: 'ACTIVITY',
            locationName: '햇살공원',
            aiTitle: '기분 최고! 신나는 공원 산책',
            aiContent: `병원 스트레스를 날려버릴 신나는 산책 시간! ${selectedPets[0]?.diaryTone || '발랄한'} 느낌으로 뛰어놀았답니다.`,
            energyLevel: 5,
            photos: [{ id: 'p2', path: photos[0] }],
            tags: ['산책', '행복'],
            dogIds: selectedDogIds
          }
        ]
      };

      setAiResult(mockResult);
      setIsAnalyzing(false);
      success('AI가 하루를 완벽하게 정리했습니다!');
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full bg-surface-green/30">
      {/* Header */}
      <div className="bg-white border-b border-border p-6 shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-surface-green rounded-xl transition-all">
            <X className="w-6 h-6 text-text-sub" />
          </button>
          <div>
            <h2 className="text-xl font-black text-text-main">{formattedDate} 기록하기</h2>
            <p className="text-[10px] font-bold text-main-green uppercase tracking-widest">Hierarchical AI Diary</p>
          </div>
        </div>
        {aiResult && (
          <button 
            onClick={() => onSave(aiResult)}
            className="px-8 py-3 bg-main-green text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            기록 저장 <Check className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {!aiResult && !isAnalyzing ? (
            /* Phase 1: Upload & Input */
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="bg-white rounded-[32px] p-8 border border-border shadow-sm space-y-8">
                {/* Photo Dropzone */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-text-main flex items-center gap-2">
                    <Camera className="w-5 h-5 text-main-green" /> 사진 일괄 업로드
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    <button 
                      onClick={handlePhotoClick}
                      className="aspect-square rounded-2xl border-2 border-dashed border-main-green/30 bg-light-green/30 flex flex-col items-center justify-center gap-2 text-main-green hover:bg-light-green/50 transition-all"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-[10px] font-bold">사진 추가</span>
                    </button>
                    {photos.map((url, i) => (
                      <div key={url} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
                        <Image src={url} alt={`Upload ${i}`} fill className="object-cover" />
                        <button 
                          onClick={() => setPhotos(photos.filter(p => p !== url))}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                {/* Dog Selection */}
                <div className="space-y-4 border-t border-border pt-8">
                  <label className="text-sm font-black text-text-main">함께한 아이들</label>
                  <div className="flex flex-wrap gap-4">
                    {pets.map(pet => (
                      <button
                        key={pet.id}
                        onClick={() => {
                          if (selectedDogIds.includes(pet.id)) {
                            setSelectedDogIds(selectedDogIds.filter(id => id !== pet.id));
                          } else {
                            setSelectedDogIds([...selectedDogIds, pet.id]);
                          }
                        }}
                        className={`flex flex-col items-center gap-2 transition-all ${
                          selectedDogIds.includes(pet.id) ? 'scale-105' : 'opacity-40 grayscale'
                        }`}
                      >
                        <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${
                          selectedDogIds.includes(pet.id) ? 'border-main-green ring-4 ring-main-green/10' : 'border-transparent'
                        }`}>
                          <Image src={pet.photo || '/dog-profile.png'} alt={pet.name} fill className="object-cover" />
                        </div>
                        <span className="text-[10px] font-black">{pet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4 border-t border-border pt-8">
                  <label className="text-sm font-black text-text-main">추가 태그 (선택)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                      placeholder="#바쁜하루 #피곤"
                      className="flex-1 px-4 py-3 bg-surface-green border border-border rounded-xl text-sm font-bold focus:outline-none"
                    />
                    <button onClick={handleAddTag} className="px-6 py-3 bg-main-green text-white font-black rounded-xl text-sm">추가</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userTags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-light-green text-main-green text-[11px] font-black rounded-lg flex items-center gap-1">
                        #{tag} <X className="w-3 h-3 cursor-pointer" onClick={() => setUserTags(userTags.filter(t => t !== tag))} />
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={triggerBatchAIAnalysis}
                  disabled={photos.length === 0 || selectedDogIds.length === 0}
                  className="w-full py-6 bg-main-green text-white font-black rounded-[24px] shadow-xl shadow-main-green/20 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-6 h-6 fill-white" />
                  <span>AI에게 하루 맡기기</span>
                  <span className="text-[10px] opacity-70">모든 사진을 분석하여 모멘트를 자동으로 나눠드려요</span>
                </button>
              </div>
            </div>
          ) : isAnalyzing ? (
            /* Phase 2: Analyzing Loading */
            <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-main-green/20 border-t-main-green animate-spin" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-main-green fill-main-green animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-text-main">AI가 사진들의 장소와 맥락을 분류 중...</h3>
                <p className="text-text-sub font-bold">봉봉이의 성격에 딱 맞는 일기를 작성하고 있어요.</p>
              </div>
            </div>
          ) : aiResult ? (
            /* Phase 3: Display Hierarchical Result */
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
              {/* Daily Summary Card */}
              <div className="bg-white rounded-[40px] overflow-hidden border border-border shadow-xl">
                <div className="relative h-64">
                  <Image src={aiResult.representativePhotoPath || ''} alt="Summary" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 text-white">
                    <span className="px-3 py-1 bg-main-green text-white text-[10px] font-black rounded-full uppercase tracking-widest mb-3 inline-block">Daily Summary</span>
                    <h1 className="text-3xl font-black tracking-tight">{aiResult.aiTitle}</h1>
                  </div>
                </div>
                <div className="p-8 lg:p-10">
                  <p className="text-lg font-medium text-text-main leading-relaxed italic">&quot;{aiResult.aiSummary}&quot;</p>
                </div>
              </div>

              {/* Moments Timeline */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-text-main flex items-center gap-2 px-4">
                  <Calendar className="w-5 h-5 text-main-green" /> 오늘의 모멘트 타임라인
                </h3>
                <div className="relative space-y-8 before:absolute before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-main-green/10">
                  {aiResult.moments.map((moment, idx) => (
                    <div key={moment.id} className="relative pl-20 pr-4">
                      {/* Timeline Dot */}
                      <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-main-green border-4 border-white shadow-sm ring-4 ring-main-green/5 z-10" />
                      
                      <div className="bg-white rounded-[32px] p-6 border border-border shadow-sm hover:shadow-md transition-all group">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="relative w-full md:w-48 aspect-video md:aspect-square rounded-2xl overflow-hidden shrink-0">
                            <Image src={moment.photos[0].path} alt={moment.aiTitle} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black text-main-green">
                              {moment.category}
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xl font-black text-text-main group-hover:text-main-green transition-colors">{moment.aiTitle}</h4>
                              <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                                <Zap className="w-3.5 h-3.5 fill-current" /> Lv.{moment.energyLevel}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-bold text-text-sub">
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {moment.locationName}</span>
                            </div>
                            <p className="text-sm font-medium text-text-main/80 leading-relaxed line-clamp-3 italic">
                              &quot;{moment.aiContent}&quot;
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {moment.tags.map(t => (
                                <span key={t} className="text-[10px] font-bold text-text-sub">#{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setAiResult(null)}
                  className="flex-1 py-4 bg-white border-2 border-border text-text-sub font-black rounded-2xl hover:bg-surface-green transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> 다시 분석하기
                </button>
                <button 
                  onClick={() => onSave(aiResult)}
                  className="flex-[2] py-4 bg-main-green text-white font-black rounded-2xl shadow-lg shadow-main-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  이대로 저장하기
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
