'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft, Camera, Sparkles, Star, Calendar,
  Tag, Type, Briefcase, Plus, Minus, Package,
  Activity, Thermometer, Flame, Coins, Ruler, Layers,
  Search, Wand2, X, AlertCircle
} from 'lucide-react';
import { useInventory, InventoryItem } from '@/app/common/hooks/useInventory';
import { useToast } from '@/app/common/hooks/useToast';
import clientApi from '@/app/common/lib/clientApi';

export default function InventoryRegisterPage() {
  const router = useRouter();
  const { addItem } = useInventory();
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // AI Editable Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('ETC');
  const [brand, setBrand] = useState('');
  const [flavor, setFlavor] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expiryDateText, setExpiryDateText] = useState('');
  const [expiryDateSpecific, setExpiryDateSpecific] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [material, setMaterial] = useState('');
  const [size, setSize] = useState('');
  const [storageMethod, setStorageMethod] = useState<'ROOM_TEMP' | 'REFRIGERATED' | 'FROZEN'>('ROOM_TEMP');
  const [suggestedUsage, setSuggestedUsage] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState(1);
  const [rating, setRating] = useState(5);
  const [isFeeding, setIsFeeding] = useState(false);
  const [openedAt, setOpenedAt] = useState('');

  const handlePhotoClick = () => {
    if (photos.length >= 3) {
      info('사진은 최대 3장까지 등록 가능합니다.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).slice(0, 3 - photos.length);
      const newPhotos = newFiles.map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newPhotos]);
      setPhotoFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [aiCandidates, setAiCandidates] = useState<Record<string, string[]>>({});
  const [aiReviewFields, setAiReviewFields] = useState<string[]>([]);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);

  const pick = <T,>(field: { value: T | null; confidence: number } | null | undefined, threshold: number, fallback: T): T => {
    if (!field) return fallback;
    return field.confidence >= threshold && field.value !== null && field.value !== undefined
      ? field.value
      : fallback;
  };

  const triggerSmartScan = async () => {
    if (photoFiles.length === 0) {
      error('최소 1장의 사진을 등록해주세요.');
      return;
    }

    setIsScanning(true);
    setShowForm(false);

    try {
      const formData = new FormData();
      photoFiles.forEach(file => formData.append('images', file));

      const response = await clientApi.post('/api/ai/analyze-product', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      const r = response.data?.data;
      if (r) {
        setCategory(pick(r.category, 0.7, 'ETC'));
        setName(pick(r.name, 0.75, ''));
        setBrand(pick(r.brand, 0.7, ''));
        setFlavor(pick(r.flavor, 0.7, ''));
        setProductionDate(pick(r.productionDate, 0.8, ''));
        setExpiryDateSpecific(pick(r.expiryDateSpecific, 0.8, ''));
        setExpiryDateText(pick(r.expiryDateText, 0.7, ''));
        setIngredients(pick(r.ingredients, 0.65, []));
        setMaterial(pick(r.material, 0.7, ''));
        setSize(pick(r.size, 0.7, ''));
        setStorageMethod(pick(r.storageMethod, 0, 'ROOM_TEMP'));
        setSuggestedUsage(pick(r.suggestedUsage, 0.65, ''));

        const candidates: Record<string, string[]> = {};
        const stringFields = ['name', 'brand', 'flavor', 'category', 'size', 'material', 'suggestedUsage', 'expiryDateText'] as const;
        stringFields.forEach(key => {
          const field = r[key];
          if (field?.candidates?.length) candidates[key] = field.candidates.filter(Boolean);
        });
        setAiCandidates(candidates);
        setAiReviewFields(r.reviewFields ?? []);
        setAiWarnings(r.warnings ?? []);
      }

      success(`${photoFiles.length > 1 ? '멀티 사진 분석' : '사진 분석'} 완료!`);
      setShowForm(true);
    } catch (err: any) {
      const status = err.response?.status;
      const errorCode = err.response?.data?.errorCode;
      if (status === 429 || errorCode === 'AI_DAILY_LIMIT_EXCEEDED') {
        error('오늘의 AI 분석 한도(10회)를 모두 사용했습니다. 내일 다시 시도해주세요.');
      } else if (status === 408 || err.code === 'ECONNABORTED') {
        error('AI 분석 시간이 초과되었습니다. 다시 시도해주세요.');
      } else {
        error('AI 분석에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return error('제품 이름을 입력해주세요.');

    try {
      const formData = new FormData();
      
      photoFiles.forEach(file => formData.append('images', file));

      const data = {
        name, category, brand, flavor: flavor || null,
        productionDate: productionDate || null,
        expiryDateText: expiryDateText || null,
        expiryDateSpecific: expiryDateSpecific || null,
        openedAt: openedAt || null,
        ingredients, material, size, storageMethod,
        suggestedUsage: suggestedUsage || null,
        price: price ? parseInt(price) : null,
        stock, rating, isFeeding,
      };
      formData.append('data', JSON.stringify(data));

      const res = await clientApi.post('/api/inventory', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update local Zustand store for immediate UI feedback
      const createdItem = res.data?.data;
      if (createdItem) {
        addItem(createdItem);
      } else {
        const newItem: InventoryItem = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2),
          name, category, brand,
          productionDate, expiryDateText, expiryDateSpecific,
          openedAt, ingredients, material, size, storageMethod,
          suggestedUsage: suggestedUsage || undefined,
          price: price ? parseInt(price) : undefined,
          stock, rating, isFeeding,
          photo: photos[0] || '',
          photos: photos.map((url, i) => ({ id: String(i), url })),
          addedAt: new Date().toISOString().split('T')[0]
        };
        addItem(newItem);
      }

      success('등록이 완료되었습니다! 🎁');
      router.push('/inventory');
    } catch (err) {
      error('등록에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const isConsumable = ['FOOD', 'SNACK', 'HEALTH'].includes(category);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 lg:p-6 shrink-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-surface-green rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-text-main" />
            </button>
            <div>
              <h1 className="text-xl font-black text-text-main">AI 스마트 등록</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-main-yellow fill-main-yellow" />
                <span className="text-[10px] font-black text-text-sub uppercase tracking-wider">Daily AI Limit: 10 / 10 Remaining</span>
              </div>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-10 pb-24">
          
          {/* Step 1: Multi-Photo Upload & Guidance */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="bg-light-yellow/50 p-6 rounded-[32px] border border-main-yellow/20 flex gap-4">
                <AlertCircle className="w-6 h-6 text-main-yellow shrink-0" />
                <div className="text-sm font-bold text-text-sub leading-relaxed">
                  <p className="text-text-main font-black mb-1">AI 인식 정확도를 높이는 팁!</p>
                  사료나 간식은 <span className="text-main-yellow font-black">제품 앞면(브랜드/이름)</span>과 <span className="text-main-yellow font-black">뒷면(성분표/유통기한)</span> 사진을 모두 올려주시면 훨씬 정확하게 자동 입력됩니다. (최대 3장)
                </div>
              </div>

              {/* AI Policy Notice */}
              <div className="bg-background/60 p-4 rounded-2xl border border-border flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <p className="text-[11px] font-bold text-text-sub">
                  <span className="text-red-500 font-black">중요:</span> AI 분석은 하루 최대 <span className="text-text-main font-black">10회</span>로 제한됩니다. 분석 시작 시 저장 여부와 관계없이 <span className="text-text-main font-black">횟수가 1회 차감</span>되니 신중하게 이용해주세요.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Photo Slots */}
              {[0, 1, 2].map((idx) => (
                <div 
                  key={idx}
                  onClick={photos[idx] ? undefined : handlePhotoClick}
                  className={`relative aspect-square rounded-[32px] border-4 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-2 ${
                    photos[idx] ? 'border-main-yellow bg-background shadow-lg' : 'border-border bg-background hover:border-main-yellow/50 cursor-pointer'
                  }`}
                >
                  {photos[idx] ? (
                    <>
                      <Image src={photos[idx]} alt={`Product ${idx + 1}`} fill className="object-cover" />
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                        className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-text-sub" />
                      <span className="text-[11px] font-black text-text-sub">
                        {idx === 0 ? '앞면 사진' : idx === 1 ? '뒷면 사진' : '추가 사진'}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />

            {!showForm && !isScanning && (
              <button 
                type="button"
                onClick={triggerSmartScan}
                disabled={photos.length === 0}
                className="w-full py-6 bg-main-yellow text-white font-black rounded-[32px] shadow-xl shadow-main-yellow/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 text-xl disabled:opacity-50 disabled:scale-100"
              >
                <Wand2 className="w-6 h-6" /> AI 분석 시작하기
              </button>
            )}

            {isScanning && (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-6 bg-background rounded-[48px] shadow-xl border border-border animate-pulse">
                <div className="relative">
                  <div className="w-24 h-24 border-[8px] border-light-yellow border-t-main-yellow rounded-full animate-spin" />
                  <Search className="absolute inset-0 m-auto w-10 h-10 text-main-yellow" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-text-main mb-2">여러 장의 사진을 대조 중...</h3>
                  <p className="text-text-sub font-bold px-10">앞면의 제품명과 뒷면의 상세 성분 정보를 통합하고 있어요.</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Form (Shown only after AI scan) */}
          {showForm && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 space-y-10">
              <div className="flex justify-center">
                <div className="bg-main-green text-white px-8 py-3 rounded-full font-black text-lg shadow-lg flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  {photoFiles.length > 1 ? '멀티 사진 분석 완료!' : '사진 분석 완료!'}
                </div>
              </div>

              {aiWarnings.length > 0 && (
                <div className="space-y-2">
                  {aiWarnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-bold text-amber-700">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {aiReviewFields.length > 0 && (
                <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>AI가 확인을 권장하는 항목: <span className="font-black">{aiReviewFields.join(', ')}</span></span>
                </div>
              )}

              {/* Editable Fields Section (Same as before but with integrated data) */}
              <div className="bg-background rounded-[40px] p-10 border border-border shadow-xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Sparkles className="w-32 h-32 text-main-yellow" />
                </div>
                
                <h3 className="text-xl font-black text-text-main flex items-center gap-3 mb-6">
                  <Search className="w-6 h-6 text-main-yellow" /> 통합 분석 결과 (수정 가능)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1">
                      <Type className="w-4 h-4" /> 제품명
                      {aiReviewFields.includes('name') && <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">확인 필요</span>}
                    </label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black text-xl focus:bg-background focus:border-main-yellow transition-all outline-none" />
                    {aiCandidates.name?.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-1">
                        <span className="text-[10px] font-black text-text-sub self-center">AI 후보:</span>
                        {aiCandidates.name.map((c, i) => (
                          <button key={i} type="button" onClick={() => setName(c)}
                            className="px-3 py-1.5 text-xs font-black bg-background border border-main-yellow/40 text-main-yellow rounded-full hover:bg-main-yellow hover:text-white transition-all">
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1">
                      <Briefcase className="w-4 h-4" /> 브랜드
                      {aiReviewFields.includes('brand') && <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">확인 필요</span>}
                    </label>
                    <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
                    {aiCandidates.brand?.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-1">
                        <span className="text-[10px] font-black text-text-sub self-center">AI 후보:</span>
                        {aiCandidates.brand.map((c, i) => (
                          <button key={i} type="button" onClick={() => setBrand(c)}
                            className="px-3 py-1.5 text-xs font-black bg-background border border-main-yellow/40 text-main-yellow rounded-full hover:bg-main-yellow hover:text-white transition-all">
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1">카테고리</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none appearance-none">
                      <option value="FOOD">사료</option>
                      <option value="SNACK">간식</option>
                      <option value="TOY">장난감</option>
                      <option value="HEALTH">영양제</option>
                      <option value="CLOTHES">의류</option>
                      <option value="ETC">기타</option>
                    </select>
                  </div>

                  {isConsumable ? (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1">
                          <Tag className="w-4 h-4 text-orange-400" /> 맛/풍미
                          {aiReviewFields.includes('flavor') && <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">확인 필요</span>}
                        </label>
                        <input type="text" value={flavor} onChange={(e) => setFlavor(e.target.value)} placeholder="예: 닭가슴살, 연어, 오리" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
                        {aiCandidates.flavor?.length > 0 && (
                          <div className="flex flex-wrap gap-2 px-1">
                            <span className="text-[10px] font-black text-text-sub self-center">AI 후보:</span>
                            {aiCandidates.flavor.map((c, i) => (
                              <button key={i} type="button" onClick={() => setFlavor(c)}
                                className="px-3 py-1.5 text-xs font-black bg-background border border-main-yellow/40 text-main-yellow rounded-full hover:bg-main-yellow hover:text-white transition-all">
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Calendar className="w-4 h-4" /> 제조일</label>
                        <input type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Calendar className="w-4 h-4 text-main-yellow" /> 유통기한 (날짜)</label>
                        <input type="date" value={expiryDateSpecific} onChange={(e) => setExpiryDateSpecific(e.target.value)} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Flame className="w-4 h-4 text-orange-400" /> 유통기한 문구</label>
                        <input type="text" value={expiryDateText} onChange={(e) => setExpiryDateText(e.target.value)} placeholder="예: 제조일로부터 18개월" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Ruler className="w-4 h-4" /> 용량/크기</label>
                        <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="예: 120g, 1kg" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
                        {aiCandidates.size?.length > 0 && (
                          <div className="flex flex-wrap gap-2 px-1">
                            <span className="text-[10px] font-black text-text-sub self-center">AI 후보:</span>
                            {aiCandidates.size.map((c, i) => (
                              <button key={i} type="button" onClick={() => setSize(c)}
                                className="px-3 py-1.5 text-xs font-black bg-background border border-main-yellow/40 text-main-yellow rounded-full hover:bg-main-yellow hover:text-white transition-all">
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Thermometer className="w-4 h-4 text-blue-400" /> 보관방법</label>
                        <select value={storageMethod} onChange={(e) => setStorageMethod(e.target.value as any)} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none appearance-none">
                          <option value="ROOM_TEMP">상온보관</option>
                          <option value="REFRIGERATED">냉장보관</option>
                          <option value="FROZEN">냉동보관</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <label className="text-sm font-black text-text-sub px-1">주요 성분 (뒷면 분석)</label>
                        <div className="flex flex-wrap gap-2 mb-2 p-6 bg-surface-green/30 rounded-[32px] border-2 border-dashed border-border">
                          {ingredients.map((ing, i) => (
                            <span key={i} className="px-5 py-2.5 bg-background border border-border rounded-full text-xs font-black flex items-center gap-2 shadow-sm">
                              {ing} <button type="button" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">×</button>
                            </span>
                          ))}
                          <div className="flex gap-2 w-full mt-2">
                            <input type="text" value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())} placeholder="성분 직접 추가" className="flex-1 px-6 py-3 bg-background border border-border rounded-xl font-bold text-sm outline-none focus:border-main-yellow" />
                            <button type="button" onClick={addIngredient} className="px-6 bg-main-yellow text-white rounded-xl font-black shadow-md">+</button>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Tag className="w-4 h-4 text-main-green" /> 급여/사용 방법</label>
                        <textarea value={suggestedUsage} onChange={(e) => setSuggestedUsage(e.target.value)} placeholder="예: 체중 5kg 기준 하루 2~3개, 충분한 물과 함께 급여하세요." rows={3} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-bold text-sm focus:bg-background focus:border-main-yellow transition-all outline-none resize-none leading-relaxed" />
                        {aiCandidates.suggestedUsage?.length > 0 && (
                          <div className="space-y-1.5 px-1">
                            <span className="text-[10px] font-black text-text-sub">AI 후보:</span>
                            {aiCandidates.suggestedUsage.map((c, i) => (
                              <button key={i} type="button" onClick={() => setSuggestedUsage(c)}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold bg-background border border-main-yellow/40 text-text-main rounded-2xl hover:border-main-yellow hover:bg-light-yellow/30 transition-all">
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Ruler className="w-4 h-4" /> 사이즈</label>
                        <input type="text" value={size} onChange={(e) => setSize(e.target.value)} placeholder="M, 25cm 등" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Layers className="w-4 h-4" /> 재질</label>
                        <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="면 100%, 고무 등" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* User Settings Section */}
              <div className="bg-background rounded-[40px] p-10 border border-border shadow-xl space-y-10">
                <h3 className="text-xl font-black text-text-main flex items-center gap-3">
                  <Package className="w-6 h-6 text-main-green" /> 집사님 추가 설정
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Coins className="w-4 h-4 text-amber-500" /> 구매 가격</label>
                    <div className="relative">
                      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none text-right pr-12" />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-text-sub">원</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Package className="w-4 h-4 text-main-green" /> 보유 수량</label>
                    <div className="flex items-center justify-between px-8 py-5 bg-surface-green/50 rounded-[24px] border-2 border-transparent">
                      <button type="button" onClick={() => setStock(Math.max(0, stock - 1))} className="w-12 h-12 rounded-full bg-background shadow-md flex items-center justify-center hover:bg-red-50 transition-all active:scale-90"><Minus className="w-6 h-6 text-text-main" /></button>
                      <span className="text-3xl font-black text-text-main">{stock}</span>
                      <button type="button" onClick={() => setStock(stock + 1)} className="w-12 h-12 rounded-full bg-background shadow-md flex items-center justify-center hover:bg-green-50 transition-all active:scale-90"><Plus className="w-6 h-6 text-text-main" /></button>
                    </div>
                  </div>

                  <div className="md:col-span-2 p-8 bg-main-green/5 rounded-[40px] flex items-center justify-between border-2 border-main-green/10">
                    <div className="flex gap-6 items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isFeeding ? 'bg-main-green text-white shadow-xl animate-pulse' : 'bg-background text-text-sub border border-border'}`}><Activity className="w-10 h-10" /></div>
                      <div>
                        <p className="font-black text-text-main text-xl">현재 급여/사용 중</p>
                        <p className="text-sm text-text-sub font-bold leading-tight mt-1">이 제품은 홈 화면과 타임라인에서 빠르게 기록할 수 있습니다.</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setIsFeeding(!isFeeding)} className={`w-20 h-10 rounded-full relative transition-all shadow-inner ${isFeeding ? 'bg-main-green' : 'bg-border'}`}>
                      <div className={`absolute top-1.5 w-7 h-7 bg-background rounded-full transition-all shadow-md ${isFeeding ? 'left-11' : 'left-1.5'}`} />
                    </button>
                  </div>

                  <div className="md:col-span-2 space-y-6 pt-4">
                    <label className="text-sm font-black text-text-main flex items-center gap-2 px-1"><Star className="w-6 h-6 text-main-yellow fill-main-yellow" /> 우리 아이 선호도</label>
                    <div className="flex gap-6 p-10 bg-surface-green/30 rounded-[48px] justify-center items-center border-2 border-border shadow-inner">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setRating(s)} className="p-1 transition-all hover:scale-125 active:scale-90">
                          <Star className={`w-14 h-14 ${s <= rating ? 'text-main-yellow fill-main-yellow' : 'text-border'}`} />
                        </button>
                      ))}
                      <span className="ml-6 text-3xl font-black text-main-yellow">{rating}점</span>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-8 bg-main-yellow text-white font-black rounded-[40px] shadow-2xl shadow-main-yellow/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 text-2xl group">
                <Package className="w-8 h-8 group-hover:rotate-12 transition-transform" /> 보물창고에 등록하기
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
