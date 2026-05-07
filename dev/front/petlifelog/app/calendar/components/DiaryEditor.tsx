'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Plus, Trash2, Sparkles, Check, RefreshCw, Calendar, MapPin, Zap, Info } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/app/common/hooks/useToast';
import { usePet } from '@/app/common/hooks/usePet';
import { DailyLog } from '@/app/common/hooks/useDiary';
import clientApi, { BACKEND_URL, toFileUrl } from '@/app/common/lib/clientApi';
import MomentImageSlider from './MomentImageSlider';

// 백엔드 AnalyzeDiaryResult 에 맞는 타입
interface StoredFileInfo {
  originalName: string;
  storedPath: string;
  contentType: string;
  fileSize: number;
  takenAt?: string;
  latitude?: number;
  longitude?: number;
}

interface RawAiResult {
  aiTitle: string;
  aiSummary: string;
  representativePhotoPath?: string;
  moments: Array<{
    category: string;
    aiTitle: string;
    aiContent: string;
    energyLevel: number;
    locationName?: string;
    tags?: string[];
    targetPetIds?: string[];
    /** 이 모멘트에 속하는 사진 파일명 목록 */
    photoFileNames?: string[];
    /** 이 모멘트 대표 사진 파일명 */
    representativePhotoPath?: string;
  }>;
}

interface DiaryEditorProps {
  date: Date;
  initialData?: DailyLog;
  onSave: (data: DailyLog) => void;
  onCancel: () => void;
}

export default function DiaryEditor({ date, initialData, onSave, onCancel }: DiaryEditorProps) {
  const { pets } = usePet();
  const { info, warning, success, error } = useToast();

  // 업로드 상태
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>([]);

  // AI 분석 결과 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiResult, setAiResult] = useState<DailyLog | null>(initialData || null);
  // 저장 시 백엔드에 그대로 넘길 원본 데이터
  const [rawAiResult, setRawAiResult] = useState<RawAiResult | null>(null);
  const [storedFiles, setStoredFiles] = useState<StoredFileInfo[]>([]);

  // 분석 횟수 제한 (최대 3회)
  const [analyzeCount, setAnalyzeCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formattedDate = date.toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });

  // ─── 사진 선택 ────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setPhotoFiles(prev => [...prev, ...fileArray]);
      setPhotoPreviews(prev => [...prev, ...fileArray.map(f => URL.createObjectURL(f))]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ─── AI 분석 (1단계) ──────────────────────────────────────────────

  const triggerBatchAIAnalysis = async () => {
    if (photoFiles.length === 0) { warning('분석할 사진을 최소 1장 이상 등록해 주세요.'); return; }
    if (selectedDogIds.length === 0) { warning('사진 속 주인공들을 선택해 주세요.'); return; }
    if (analyzeCount >= 3) { 
      warning('AI 분석은 최대 3회까지만 가능합니다. 현재 결과를 저장하거나 다시 시작해 주세요.'); 
      return; 
    }

    setIsAnalyzing(true);
    info(`AI가 사진들을 분석 중입니다... (남은 횟수: ${2 - analyzeCount}회)`);

    try {
      const formData = new FormData();
      photoFiles.forEach(file => formData.append('images', file));

      const selectedPets = pets.filter(p => selectedDogIds.includes(p.id));
      formData.append('petInfo', JSON.stringify(selectedPets));
      if (userTags.length > 0) formData.append('userTags', JSON.stringify(userTags));

      const response = await clientApi.post('/api/ai/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 응답 구조: ApiResponse<AnalyzeDiaryResult>
      const analyzeResult = response.data?.data;
      if (!analyzeResult?.aiResult?.moments) {
        throw new Error('AI 응답 데이터 구조가 올바르지 않습니다.');
      }

      const raw: RawAiResult = analyzeResult.aiResult;
      const files: StoredFileInfo[] = analyzeResult.storedFiles ?? [];

      // originalName → fileUrl 매핑 (AI 분석 중 저장된 파일 URL)
      const nameToUrl = new Map<string, string>(
        files.map(f => [f.originalName, toFileUrl(f.storedPath)])
      );

      const getPhotoUrl = (filename?: string): string => {
        if (filename) {
          const url = nameToUrl.get(filename);
          if (url) return url;
        }
        // fallback: 로컬 미리보기
        return photoPreviews[0] ?? '';
      };

      const processed: DailyLog = {
        id: Math.random().toString(36).slice(2, 9),
        dateKey: date.toISOString().split('T')[0],
        aiTitle: raw.aiTitle || '오늘의 일기',
        aiSummary: raw.aiSummary || '',
        representativePhotoPath: getPhotoUrl(raw.representativePhotoPath),
        moments: raw.moments.map((m, idx) => {
          // 이 모멘트에 배정된 사진들을 URL로 변환
          const momentPhotos = (m.photoFileNames ?? [])
            .map((fname, pi) => ({ id: `p-${idx}-${pi}`, path: nameToUrl.get(fname) ?? '' }))
            .filter(p => p.path);

          // 대표 사진: 모멘트 지정 → 전체 대표 → 모멘트 첫 번째 사진 → 로컬 미리보기 순 fallback
          const repPath =
            nameToUrl.get(m.representativePhotoPath ?? '') ||
            nameToUrl.get(raw.representativePhotoPath ?? '') ||
            momentPhotos[0]?.path ||
            photoPreviews[0] || '';

          return {
            id: `m-${idx}-${Date.now()}`,
            category: (m.category as 'ACTIVITY' | 'GENERAL' | 'OBJECT' | 'HEALTH') || 'GENERAL',
            locationName: m.locationName || '알 수 없는 곳',
            aiTitle: m.aiTitle || '기록',
            aiContent: m.aiContent || '',
            energyLevel: m.energyLevel || 3,
            photos: momentPhotos.length > 0
              ? momentPhotos
              : [{ id: `p-${idx}-0`, path: repPath }],
            tags: m.tags || [],
            dogIds: m.targetPetIds || selectedDogIds,
          };
        }),
      };

      setRawAiResult(raw);
      setStoredFiles(files);
      setAiResult(processed);
      setAnalyzeCount(prev => prev + 1);
      success('AI가 하루를 완벽하게 정리했습니다!');

    } catch (err: unknown) {
      console.error('AI Analysis Error:', err);
      const errorObj = err as { code?: string };
      error(errorObj.code === 'ECONNABORTED'
        ? '분석 시간이 너무 오래 걸립니다. 다시 시도해 주세요.'
        : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── 최종 저장 (2단계) ────────────────────────────────────────────

  const handleSave = async (data: DailyLog) => {
    if (!rawAiResult || storedFiles.length === 0) {
      // initialData 로 연 경우(수정) - 백엔드 저장 없이 로컬 상태만 업데이트
      onSave(data);
      return;
    }

    setIsSaving(true);
    try {
      await clientApi.post('/api/ai/save', {
        aiResult: rawAiResult,
        storedFiles,
        petIds: selectedDogIds,
      });
      onSave(data);
    } catch (err: unknown) {
      console.error('Save Error:', err);
      error('저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReAnalyze = () => {
    setAiResult(null);
    setRawAiResult(null);
    setStoredFiles([]);
  };

  // ─── 렌더링 ───────────────────────────────────────────────────────

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
            onClick={() => handleSave(aiResult)}
            disabled={isSaving}
            className="px-8 py-3 bg-main-green text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : (<>기록 저장 <Check className="w-5 h-5" /></>)}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-10">

          {!aiResult && !isAnalyzing ? (
            /* Phase 1: 사진 업로드 & 입력 */
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="bg-white rounded-[32px] p-8 border border-border shadow-sm space-y-8">
                {/* 사진 업로드 */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-text-main flex items-center gap-2">
                    <Camera className="w-5 h-5 text-main-green" /> 사진 일괄 업로드
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-main-green/30 bg-light-green/30 flex flex-col items-center justify-center gap-2 text-main-green hover:bg-light-green/50 transition-all"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-[10px] font-bold">사진 추가</span>
                    </button>
                    {photoPreviews.map((url, i) => (
                      <div key={url} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
                        <Image src={url} alt={`Upload ${i}`} fill className="object-cover" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>

                {/* 함께한 아이들 */}
                <div className="space-y-4 border-t border-border pt-8">
                  <label className="text-sm font-black text-text-main">함께한 아이들</label>
                  <div className="flex flex-wrap gap-4">
                    {pets.map(pet => (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedDogIds(prev =>
                          prev.includes(pet.id) ? prev.filter(id => id !== pet.id) : [...prev, pet.id]
                        )}
                        className={`flex flex-col items-center gap-2 transition-all ${selectedDogIds.includes(pet.id) ? 'scale-105' : 'opacity-40 grayscale'}`}
                      >
                        <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 ${selectedDogIds.includes(pet.id) ? 'border-main-green ring-4 ring-main-green/10' : 'border-transparent'}`}>
                          <Image src={pet.photo || '/dog-profile.png'} alt={pet.name} fill className="object-cover" />
                        </div>
                        <span className="text-[10px] font-black">{pet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 태그 */}
                <div className="space-y-4 border-t border-border pt-8">
                  <label className="text-sm font-black text-text-main">추가 태그 (선택)</label>
                  <div className="flex gap-2">
                    <input
                      type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && newTag.trim() && !userTags.includes(newTag.trim())) { setUserTags(p => [...p, newTag.trim()]); setNewTag(''); } }}
                      placeholder="#바쁜하루 #피곤"
                      className="flex-1 px-4 py-3 bg-surface-green border border-border rounded-xl text-sm font-bold focus:outline-none"
                    />
                    <button
                      onClick={() => { if (newTag.trim() && !userTags.includes(newTag.trim())) { setUserTags(p => [...p, newTag.trim()]); setNewTag(''); } }}
                      className="px-6 py-3 bg-main-green text-white font-black rounded-xl text-sm"
                    >추가</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userTags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-light-green text-main-green text-[11px] font-black rounded-lg flex items-center gap-1">
                        #{tag} <X className="w-3 h-3 cursor-pointer" onClick={() => setUserTags(p => p.filter(t => t !== tag))} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={triggerBatchAIAnalysis}
                    disabled={photoPreviews.length === 0 || selectedDogIds.length === 0 || analyzeCount >= 3}
                    className="w-full py-6 bg-main-green text-white font-black rounded-[24px] shadow-xl shadow-main-green/20 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-6 h-6 fill-white" />
                    <span>AI에게 하루 맡기기 {analyzeCount > 0 && `(${analyzeCount}/3)`}</span>
                    <span className="text-[10px] opacity-70">모든 사진을 분석하여 모멘트를 자동으로 나눠드려요</span>
                  </button>
                  {analyzeCount > 0 && (
                    <p className="text-center text-[10px] font-bold text-text-sub flex items-center justify-center gap-1">
                      <Info className="w-3 h-3" /> AI 분석은 하루 최대 3회까지 권장됩니다. ({analyzeCount}/3)
                    </p>
                  )}
                </div>
              </div>
            </div>

          ) : isAnalyzing ? (
            /* Phase 2: 분석 중 */
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
            /* Phase 3: AI 결과 표시 */
            <div className="space-y-6 lg:space-y-10 animate-in slide-in-from-bottom-8 duration-700">
              {/* 일일 요약 */}
              <div className="bg-white rounded-[32px] overflow-hidden border border-border shadow-sm">
                {aiResult.representativePhotoPath && (
                  <div className="relative w-full h-48 lg:h-64 bg-surface-green/10 border-b border-border/50">
                    <Image 
                      src={aiResult.representativePhotoPath} 
                      alt="오늘의 대표 사진" 
                      fill 
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
                <div className="p-6 lg:p-10 space-y-4 lg:space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-main-green/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-main-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black text-main-green uppercase tracking-widest mb-1 block">Daily Summary</span>
                      <h1 className="text-xl lg:text-2xl font-black text-text-main">{aiResult.aiTitle}</h1>
                    </div>
                  </div>
                  <div className="relative pl-6 border-l-2 border-main-green/20">
                    <p className="text-base lg:text-lg font-medium text-text-main leading-relaxed italic">
                      &quot;{aiResult.aiSummary}&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* 모멘트 타임라인 */}
              <div className="space-y-6">
                <h3 className="text-lg lg:text-xl font-black text-text-main flex items-center gap-2 px-4">
                  <Calendar className="w-5 h-5 text-main-green" /> 오늘의 모멘트 타임라인
                </h3>
                <div className="relative space-y-6 lg:space-y-8 before:absolute before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-main-green/10">
                  {aiResult.moments.map((moment, idx) => (
                    <div key={moment.id} className="relative pl-14 lg:pl-20 pr-0 lg:pr-4">
                      <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-main-green border-4 border-white shadow-sm ring-4 ring-main-green/5 z-10" />
                      <div className="bg-white rounded-[24px] lg:rounded-[32px] overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group">

                        {/* 사진 영역: 슬라이더 적용 */}
                        {moment.photos && moment.photos.length > 0 && (
                          <div className="relative w-full h-48 lg:h-64 bg-surface-green/10">
                            <MomentImageSlider 
                              photos={moment.photos} 
                              alt={moment.aiTitle} 
                            />
                            <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black text-main-green z-10">
                              {moment.category}
                            </div>
                          </div>
                        )}

                        <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-lg lg:text-xl font-black text-text-main group-hover:text-main-green transition-colors">{moment.aiTitle}</h4>
                            <div className="flex items-center gap-1 text-amber-500 font-black text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 shrink-0">
                              <Zap className="w-3 h-3 fill-current" /> Lv.{moment.energyLevel}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] lg:text-[11px] font-bold text-text-sub">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {moment.locationName}</span>
                          </div>
                          <p className="text-sm lg:text-base font-medium text-text-main/80 leading-relaxed italic">
                            &quot;{moment.aiContent}&quot;
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-1 lg:pt-2">
                            {moment.tags.map(t => (
                              <span key={t} className="text-[10px] font-bold text-text-sub px-2 py-0.5 bg-surface-green rounded-md border border-border/50">#{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 액션 */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleReAnalyze}
                  className="flex-1 py-4 bg-white border-2 border-border text-text-sub font-black rounded-2xl hover:bg-surface-green transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> 다시 분석하기
                </button>
                <button
                  onClick={() => handleSave(aiResult)}
                  disabled={isSaving}
                  className="flex-[2] py-4 bg-main-green text-white font-black rounded-2xl shadow-lg shadow-main-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSaving ? '저장 중...' : '이대로 저장하기'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
