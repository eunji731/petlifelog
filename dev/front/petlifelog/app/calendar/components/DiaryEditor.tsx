'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Camera, Plus, Trash2, Sparkles, Check, RefreshCw, Calendar, MapPin, Zap, Info, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/app/common/hooks/useToast';
import { usePet } from '@/app/common/hooks/usePet';
import { DailyLog } from '@/app/common/hooks/useDiary';
import clientApi, { toFileUrl, getImagePath } from '@/app/common/lib/clientApi';
import MomentImageSlider from './MomentImageSlider';

// 백엔드 AnalyzeDiaryResult 에 맞는 타입
interface StoredFileInfo {
  originalName: string;
  storedPath: string;
  fileUrl?: string;
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
  // AI 호출 전 EXIF 날짜 불일치 확인 모달
  const [preAiDateModal, setPreAiDateModal] = useState<{ exifDates: string[] } | null>(null);
  // AI 호출 전 메타데이터 누락 확인 모달 (백엔드 EXIF 결과 기반)
  const [preMetaModal, setPreMetaModal] = useState<{ missingDate: boolean; missingGps: boolean } | null>(null);
  // AI 에러 모달
  const [aiErrorModal, setAiErrorModal] = useState<{ title: string; message: string } | null>(null);
  // 메타데이터 누락 경고
  const [metaWarnings, setMetaWarnings] = useState<{ missingDate: boolean; missingLocation: boolean } | null>(null);

  // 서버 사용량 상태
  const [usageInfo, setUsageInfo] = useState<{
    dateCount: number; dateLimit: number;
    dailyTotal: number; dailyLimit: number;
    dateBlocked: boolean; dailyBlocked: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetDateStr = date.toLocaleDateString('en-CA'); // "yyyy-MM-dd"

  const formattedDate = date.toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });

  // ─── 사용량 조회 ──────────────────────────────────────────────────

  const fetchUsage = useCallback(async () => {
    try {
      const res = await clientApi.get(`/api/ai/usage?targetDate=${targetDateStr}`);
      setUsageInfo(res.data?.data ?? null);
    } catch {
      // 조회 실패는 무시 (버튼 활성화 유지)
    }
  }, [targetDateStr]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  // ─── 사진 선택 ────────────────────────────────────────────────────

  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);

      if (photoFiles.length + fileArray.length > 5) {
        toast('사진은 최대 5개까지만 업로드 가능합니다.', 'warning');
        // Limit to 5 total if some were already present
        const remainingSlots = 5 - photoFiles.length;
        if (remainingSlots <= 0) return;

        const slicedFiles = fileArray.slice(0, remainingSlots);
        setPhotoFiles(prev => [...prev, ...slicedFiles]);
        setPhotoPreviews(prev => [...prev, ...slicedFiles.map(f => URL.createObjectURL(f))]);
      } else {
        setPhotoFiles(prev => [...prev, ...fileArray]);
        setPhotoPreviews(prev => [...prev, ...fileArray.map(f => URL.createObjectURL(f))]);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ─── EXIF 파싱 (날짜 + GPS 존재 여부) ───────────────────────────

  // hasGps: true=GPS있음, false=EXIF파싱성공+GPS없음, null=파싱불가(비JPEG등)
  const readExifMeta = (file: File): Promise<{ date: string | null; hasGps: boolean | null }> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const buf = e.target?.result as ArrayBuffer;
          const view = new DataView(buf);
          if (view.getUint16(0) !== 0xFFD8) { resolve({ date: null, hasGps: null }); return; }
          let offset = 2;
          while (offset < view.byteLength - 2) {
            if (view.getUint8(offset) !== 0xFF) break;
            const marker = view.getUint8(offset + 1);
            const segLen = view.getUint16(offset + 2);
            if (marker === 0xE1) {
              const exifHeader = String.fromCharCode(
                view.getUint8(offset + 4), view.getUint8(offset + 5),
                view.getUint8(offset + 6), view.getUint8(offset + 7)
              );
              if (exifHeader === 'Exif') {
                const tiffStart = offset + 10;
                const littleEndian = view.getUint16(tiffStart) === 0x4949;
                const getU16 = (o: number) => view.getUint16(tiffStart + o, littleEndian);
                const getU32 = (o: number) => view.getUint32(tiffStart + o, littleEndian);
                const ifd0 = getU32(4);
                const tagCount = getU16(ifd0);
                let exifIfdOffset = -1;
                let hasGps = false;
                for (let i = 0; i < tagCount; i++) {
                  const tagOffset = ifd0 + 2 + i * 12;
                  const tag = getU16(tagOffset);
                  if (tag === 0x8769) { exifIfdOffset = getU32(tagOffset + 8); }
                  if (tag === 0x8825) { hasGps = true; }
                }
                let date: string | null = null;
                if (exifIfdOffset >= 0) {
                  const exifTagCount = getU16(exifIfdOffset);
                  for (let i = 0; i < exifTagCount; i++) {
                    const tagOffset = exifIfdOffset + 2 + i * 12;
                    if (getU16(tagOffset) === 0x9003) {
                      const valOffset = getU32(tagOffset + 8);
                      let dateStr = '';
                      for (let c = 0; c < 10; c++) {
                        dateStr += String.fromCharCode(view.getUint8(tiffStart + valOffset + c));
                      }
                      date = dateStr.replace(/:/g, '-').slice(0, 10);
                      break;
                    }
                  }
                }
                // EXIF 파싱 성공 → hasGps는 확정값(true/false)
                resolve({ date, hasGps });
                return;
              }
            }
            offset += 2 + segLen;
          }
          // EXIF 세그먼트 없음 → GPS 여부 불명
          resolve({ date: null, hasGps: null });
        } catch {
          // 파싱 실패 → GPS 여부 불명 (false로 잘못 경고하지 않음)
          resolve({ date: null, hasGps: null });
        }
      };
      reader.readAsArrayBuffer(file.slice(0, 65536));
    });

  // ─── AI 분석 (1단계) ──────────────────────────────────────────────

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    const remaining = usageInfo ? usageInfo.dateLimit - usageInfo.dateCount - 1 : '?';
    info(`AI가 사진들을 분석 중입니다... (이 날짜 사용 후 남은 횟수: ${remaining}회)`);

    try {
      const formData = new FormData();
      formData.append('targetDate', targetDateStr);
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
        files.map(f => [f.originalName, f.fileUrl ?? toFileUrl(f.storedPath)])
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
        dateKey: date.toLocaleDateString('en-CA'),
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
      await fetchUsage();

      // 메타데이터 누락 체크
      const hasMissingDate = files.some(f => !f.takenAt);
      const hasMissingLocation = files.some(f => f.latitude == null);
      setMetaWarnings(hasMissingDate || hasMissingLocation ? { missingDate: hasMissingDate, missingLocation: hasMissingLocation } : null);

      success('AI가 하루를 완벽하게 정리했습니다!');

    } catch (err: unknown) {
      console.error('AI Analysis Error:', err);
      const axiosErr = err as { code?: string; response?: { status?: number; data?: { error?: { code?: string; message?: string } } } };

      if (axiosErr.response?.status === 429) {
        const serverCode = axiosErr.response?.data?.error?.code;
        const serverMsg = axiosErr.response?.data?.error?.message;
        if (serverCode === 'AI_DATE_LIMIT_EXCEEDED') {
          error(`📅 ${serverMsg ?? `${formattedDate}의 AI 일기 기회 ${usageInfo?.dateLimit ?? 2}회를 모두 사용했습니다.`}`);
        } else if (serverCode === 'AI_DAILY_LIMIT_EXCEEDED') {
          error(`🚫 ${serverMsg ?? `오늘 AI 일기 한도(${usageInfo?.dailyLimit ?? 10}회)를 초과했습니다. 내일 다시 시도해 주세요.`}`);
        } else {
          error('AI 사용 한도를 초과했습니다.');
        }
        await fetchUsage();
      } else if (axiosErr.code === 'ECONNABORTED') {
        setAiErrorModal({ title: '분석 시간 초과', message: '사진 분석 시간이 너무 오래 걸렸어요.\n사진 수를 줄이거나 잠시 후 다시 시도해 주세요.' });
      } else if (axiosErr.response?.status === 500) {
        setAiErrorModal({ title: 'AI 분석에 실패했어요', message: '서버에서 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.\n\n문제가 반복되면 사진 수를 줄여서 시도해 보세요.' });
      } else {
        setAiErrorModal({ title: 'AI 분석 오류', message: 'AI 분석 중 오류가 발생했습니다.\n다시 시도해 주세요.' });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerBatchAIAnalysis = async () => {
    if (photoFiles.length === 0) { warning('분석할 사진을 최소 1장 이상 등록해 주세요.'); return; }
    if (selectedDogIds.length === 0) { warning('사진 속 주인공들을 선택해 주세요.'); return; }
    if (usageInfo?.dateBlocked) {
      warning(`${formattedDate}의 AI 일기 작성 기회(${usageInfo.dateLimit}회)를 모두 사용했습니다. 다른 날짜를 선택해 주세요.`);
      return;
    }
    if (usageInfo?.dailyBlocked) {
      warning(`오늘의 AI 일기 작성 한도(${usageInfo?.dailyLimit}회)를 모두 사용했습니다. 내일 다시 시도해 주세요.`);
      return;
    }

    // 1) 날짜 불일치 체크 (클라이언트 EXIF)
    const exifResults = await Promise.all(photoFiles.map(readExifMeta));
    const exifDates = [...new Set(exifResults.map(r => r.date).filter((d): d is string => d !== null))];
    const mismatchedDates = exifDates.filter(d => d !== targetDateStr);

    if (mismatchedDates.length > 0) {
      setPreAiDateModal({ exifDates: mismatchedDates });
      return;
    }

    // 2) 메타데이터 누락 체크 (백엔드 EXIF — 신뢰할 수 있는 결과)
    try {
      const metaForm = new FormData();
      photoFiles.forEach(file => metaForm.append('images', file));
      const metaRes = await clientApi.post('/api/ai/check-metadata', metaForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const metaList: { originalName: string; hasDate: boolean; hasGps: boolean }[] = metaRes.data?.data ?? [];
      const hasMissingDate = metaList.some(m => !m.hasDate);
      const hasMissingGps = metaList.some(m => !m.hasGps);
      if (hasMissingDate || hasMissingGps) {
        setPreMetaModal({ missingDate: hasMissingDate, missingGps: hasMissingGps });
        return;
      }
    } catch {
      // 메타데이터 체크 실패 시 그냥 AI 분석 진행
    }

    await runAIAnalysis();
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
      const saveResponse = await clientApi.post('/api/ai/save', {
        targetDate: targetDateStr,
        aiResult: rawAiResult,
        storedFiles,
        petIds: selectedDogIds,
      });
      const memoryId: string = saveResponse.data?.data;
      onSave(memoryId ? { ...data, id: memoryId } : data);
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
    setMetaWarnings(null);
  };

  // ─── 렌더링 ───────────────────────────────────────────────────────

  const formatKoreanDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col h-full bg-surface-green/30">
      {/* AI 호출 전 날짜 불일치 확인 모달 */}
      {preAiDateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-[28px] shadow-2xl p-8 mx-6 max-w-sm w-full space-y-6">
            <div className="space-y-2">
              <p className="text-base font-black text-text-main">사진 촬영일이 달라요</p>
              <p className="text-sm font-medium text-text-sub leading-relaxed">
                사진의 촬영 날짜({preAiDateModal.exifDates.map(formatKoreanDate).join(', ')})가
                선택한 날짜({formatKoreanDate(targetDateStr)})와 다릅니다.
              </p>
              <p className="text-sm font-medium text-text-sub">
                선택한 날짜({formatKoreanDate(targetDateStr)})로 AI 분석을 진행할까요?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreAiDateModal(null)}
                className="flex-1 py-3 bg-surface-green border border-border text-text-sub font-black rounded-2xl text-sm hover:bg-surface-green/80 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => { setPreAiDateModal(null); runAIAnalysis(); }}
                className="flex-[2] py-3 bg-main-green text-white font-black rounded-2xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {formatKoreanDate(targetDateStr)}로 진행
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI 호출 전 메타데이터 누락 확인 모달 */}
      {preMetaModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-[28px] shadow-2xl p-8 mx-6 max-w-sm w-full space-y-6">
            <div className="space-y-3">
              <p className="text-base font-black text-text-main">사진 정보가 부족해요</p>
              {preMetaModal.missingDate && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                  <Calendar className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-amber-700 leading-relaxed">
                    <span className="font-black">촬영 날짜 없음</span> — 시간 순서가 부정확할 수 있고, 선택한 날짜({formattedDate})로 저장됩니다.
                  </p>
                </div>
              )}
              {preMetaModal.missingGps && (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-blue-700 leading-relaxed">
                    <span className="font-black">위치 정보 없음</span> — 해당 추억은 지도 메뉴에 표시되지 않아요.
                  </p>
                </div>
              )}
              <p className="text-sm font-medium text-text-sub">그래도 AI 분석을 진행할까요?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreMetaModal(null)}
                className="flex-1 py-3 bg-surface-green border border-border text-text-sub font-black rounded-2xl text-sm hover:bg-surface-green/80 transition-all"
              >
                취소
              </button>
              <button
                onClick={() => { setPreMetaModal(null); runAIAnalysis(); }}
                className="flex-[2] py-3 bg-main-green text-white font-black rounded-2xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                그래도 진행하기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI 에러 모달 */}
      {aiErrorModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-[28px] shadow-2xl p-8 mx-6 max-w-sm w-full space-y-6">
            <div className="space-y-2">
              <p className="text-base font-black text-text-main">{aiErrorModal.title}</p>
              <p className="text-sm font-medium text-text-sub leading-relaxed whitespace-pre-line">
                {aiErrorModal.message}
              </p>
            </div>
            <button
              onClick={() => setAiErrorModal(null)}
              className="w-full py-3 bg-main-green text-white font-black rounded-2xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4 shrink-0 flex justify-between items-center">
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

      <div className="flex-1 overflow-y-auto px-6 py-2 lg:px-10 lg:py-4 no-scrollbar">
        <div className="max-w-4xl mx-auto space-y-10">

          {!aiResult && !isAnalyzing ? (
            /* Phase 1: 사진 업로드 & 입력 */
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="bg-background rounded-[32px] p-8 border border-border shadow-sm space-y-8">
                {/* 사진 업로드 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-text-main flex items-center gap-2">
                      <Camera className="w-5 h-5 text-main-green" /> 사진 일괄 업로드
                    </label>
                    <span className={`text-[10px] font-black ${photoFiles.length >= 5 ? 'text-red-500' : 'text-main-green'}`}>
                      {photoFiles.length} / 5
                    </span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoFiles.length >= 5}
                      className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${photoFiles.length >= 5
                          ? 'border-border bg-surface-green/50 text-text-sub cursor-not-allowed'
                          : 'border-main-green/30 bg-light-green/30 text-main-green hover:bg-light-green/50'
                        }`}
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-[10px] font-bold">사진 추가</span>
                    </button>
                    {photoPreviews.map((url, i) => (<div key={url} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
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
                          <Image src={getImagePath(pet.photo, 'profiles')} alt={pet.name} fill className="object-cover" />
                        </div>
                        <span className="text-[10px] font-black">{pet.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 태그 */}
                <div className="space-y-4 border-t border-border pt-8">
                  <div>
                    <label className="text-sm font-black text-text-main">
                      추가 태그(선택)
                    </label>
                    <p className="mt-1 text-xs font-medium text-text-sub/70 leading-relaxed">
                      <span className="text-main-green font-black">💡 AI가 더 정확한 일기를 작성할 수 있도록 중요한 단어와 상황을 적어주세요.</span><br />
                      태그를 입력한 뒤 Enter를 눌러 추가하세요.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && newTag.trim() && !userTags.includes(newTag.trim())) { setUserTags(p => [...p, newTag.trim()]); setNewTag(''); } }}
                      placeholder="#서울숲 #피곤 #카페 #산책"
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
                  {/* 사용량 안내 배너 */}
                  {usageInfo && (
                    <div className={`rounded-2xl px-4 py-3 text-[11px] font-bold space-y-1 ${usageInfo.dateBlocked || usageInfo.dailyBlocked
                      ? 'bg-red-50 border border-red-200 text-red-600'
                      : usageInfo.dateCount > 0 || usageInfo.dailyTotal > 0
                        ? 'bg-amber-50 border border-amber-200 text-amber-700'
                        : 'bg-light-green border border-main-green/20 text-main-green'
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          이 날짜 사용 횟수
                        </span>
                        <span className={`font-black ${usageInfo.dateBlocked ? 'text-red-600' : ''}`}>
                          {usageInfo.dateCount} / {usageInfo.dateLimit}회
                          {usageInfo.dateBlocked && ' (소진)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          오늘 전체 사용 횟수
                        </span>
                        <span className={`font-black ${usageInfo.dailyBlocked ? 'text-red-600' : ''}`}>
                          {usageInfo.dailyTotal} / {usageInfo.dailyLimit}회
                          {usageInfo.dailyBlocked && ' (소진)'}
                        </span>
                      </div>
                      {usageInfo.dateBlocked && (
                        <p className="text-red-600 pt-1 border-t border-red-200">
                          이 날짜의 AI 일기 기회를 모두 사용했습니다. 다른 날짜를 선택해 주세요.
                        </p>
                      )}
                      {!usageInfo.dateBlocked && usageInfo.dailyBlocked && (
                        <p className="text-red-600 pt-1 border-t border-red-200">
                          오늘 AI 일기 한도를 초과했습니다. 내일 다시 시도해 주세요.
                        </p>
                      )}
                    </div>
                  )}

                  {/* AI Accuracy Warning */}
                  <div className="mb-4 space-y-2 p-4 bg-main-yellow/5 border border-main-yellow/20 rounded-2xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-main-yellow shrink-0 mt-0.5" />
                      <p className="text-[10px] lg:text-[11px] font-medium text-text-sub leading-tight">
                        AI 일기는 입력하신 데이터를 기반으로 작성되어 실제 사실과 다를 수 있습니다. 생성 후 내용을 반드시 확인 및 수정해 주세요.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 pl-6 relative before:absolute before:left-2 before:top-2 before:w-1 before:h-1 before:bg-main-yellow/40 before:rounded-full">
                      <p className="text-[10px] lg:text-[11px] font-medium text-text-sub/80 leading-tight">
                        추가 태그를 상세히 적어주시면 우리 아이만의 특별한 순간을 더 정확하게 기록할 수 있어요.
                      </p>
                    </div>
                    <div className="flex items-start gap-2 pl-6 relative before:absolute before:left-2 before:top-2 before:w-1 before:h-1 before:bg-main-yellow/40 before:rounded-full">
                      <p className="text-[10px] lg:text-[11px] font-medium text-text-sub/80 leading-tight">
                        사진의 위치나 시간 정보(메타데이터)가 없는 경우 AI의 분류 정확도가 낮아질 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={triggerBatchAIAnalysis} disabled={
                      photoPreviews.length === 0 ||
                      selectedDogIds.length === 0 ||
                      usageInfo?.dateBlocked === true ||
                      usageInfo?.dailyBlocked === true
                    }
                    className="w-full py-6 bg-main-green text-white font-black rounded-[24px] shadow-xl shadow-main-green/20 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-6 h-6 fill-white" />
                    <span>AI에게 하루 맡기기</span>
                    <span className="text-[10px] opacity-70">모든 사진을 분석하여 모멘트를 자동으로 나눠드려요</span>
                  </button>
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
                <p className="text-text-sub font-bold">{pets.filter(p => selectedDogIds.includes(p.id)).map(p => p.name).join(', ')}의 성격에 딱 맞는 일기를 작성하고 있어요.</p>
              </div>
            </div>

          ) : aiResult ? (
            /* Phase 3: AI 결과 표시 */
            <div className="space-y-6 lg:space-y-10 animate-in slide-in-from-bottom-8 duration-700">
              {/* 일일 요약 */}
              <div className="bg-background rounded-[32px] overflow-hidden border border-border shadow-sm">
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
                      <div className="absolute left-6 top-6 w-4 h-4 rounded-full bg-main-green border-4 border-background shadow-sm ring-4 ring-main-green/5 z-10" />
                      <div className="bg-background rounded-[24px] lg:rounded-[32px] overflow-hidden border border-border shadow-sm hover:shadow-md transition-all group">

                        {/* 사진 영역: 슬라이더 적용 */}
                        {moment.photos && moment.photos.length > 0 && (
                          <div className="relative w-full h-48 lg:h-64 bg-surface-green/10">
                            <MomentImageSlider
                              photos={moment.photos}
                              alt={moment.aiTitle}
                            />
                            <div className="absolute top-3 left-3 px-2 py-1 bg-background/90 backdrop-blur-md rounded-lg text-[9px] font-black text-main-green z-10">
                              {moment.category}
                            </div>
                          </div>
                        )}

                        <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-lg lg:text-xl font-black text-text-main group-hover:text-main-green transition-colors">{moment.aiTitle}</h4>
                            <div className="flex items-center gap-1 text-amber-500 font-black text-[10px] bg-amber-50 dark:bg-amber-900/10 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/20 shrink-0">
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
                              <span key={t} className="text-[10px] font-bold text-text-sub px-2 py-0.5 bg-surface-green dark:bg-white/5 rounded-md border border-border/50">#{t}</span>
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
                <div className="flex-1 flex flex-col gap-2">
                  {metaWarnings && (
                    <div className="space-y-1.5">
                      {metaWarnings.missingDate && (
                        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-xl px-3 py-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-500 leading-relaxed">
                            날짜 정보가 없어 시간 순서가 부정확할 수 있어요. {formattedDate}로 저장됩니다.
                          </p>
                        </div>
                      )}
                      {metaWarnings.missingLocation && (
                        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 rounded-xl px-3 py-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-medium text-blue-700 dark:text-blue-500 leading-relaxed">
                            위치 정보가 없어 지도 메뉴에 표시되지 않아요.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleReAnalyze}
                    className="w-full py-4 bg-background border-2 border-border text-text-sub font-black rounded-2xl hover:bg-surface-green transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> 다시 분석하기
                  </button>
                </div>
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
