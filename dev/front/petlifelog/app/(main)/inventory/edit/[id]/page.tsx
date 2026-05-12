'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft, Camera, Sparkles, Star, Calendar,
  Tag, Type, Briefcase, Plus, Minus, Package,
  Activity, Thermometer, Flame, Coins, Ruler, Layers,
  Search, X, Save
} from 'lucide-react';
import { useInventory, InventoryItem } from '@/app/common/hooks/useInventory';
import { useToast } from '@/app/common/hooks/useToast';
import clientApi, { getImagePath } from '@/app/common/lib/clientApi';

export default function InventoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { items, loading: listLoading, updateItem, fetchItems } = useInventory();
  const { success, error, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIds, setPhotoIds] = useState<(string | null)[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  
  // Form States
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

  const applyItemData = useCallback((item: InventoryItem) => {
    setName(item.name || '');
    setCategory(item.category || 'ETC');
    setBrand(item.brand || '');
    setFlavor(item.flavor || '');
    setProductionDate(item.productionDate || '');
    setExpiryDateText(item.expiryDateText || '');
    setExpiryDateSpecific(item.expiryDateSpecific || '');
    setIngredients(item.ingredients || []);
    setMaterial(item.material || '');
    setSize(item.size || '');
    setStorageMethod(item.storageMethod || 'ROOM_TEMP');
    setSuggestedUsage(item.suggestedUsage || '');
    setPrice(item.price?.toString() || '');
    setStock(item.stock || 0);
    setRating(item.rating || 5);
    setIsFeeding(item.isFeeding || false);
    setOpenedAt(item.openedAt || '');
    
    if (item.photos && item.photos.length > 0) {
      setPhotos(item.photos.map(p => p.url));
      setPhotoIds(item.photos.map(p => p.id));
    } else if (item.photo) {
      setPhotos([getImagePath(item.photo)]);
      setPhotoIds([null]);
    }
    setDeletedPhotoIds([]);
    setPhotoFiles([]);
  }, []);

  // Ensure list is loaded
  useEffect(() => {
    if (items.length === 0 && !listLoading) {
      fetchItems();
    }
  }, [items.length, listLoading, fetchItems]);

  // Handle data loading
  useEffect(() => {
    const initData = async () => {
      if (!id || !isLoading) return;

      // Find in store first (Zustand makes this potentially instant)
      const found = items.find(i => String(i.id) === String(id));
      if (found) {
        applyItemData(found);
        setIsLoading(false);
        return;
      }

      // If not in store and list loading is done, try individual API fallback
      if (!listLoading) {
        try {
          const res = await clientApi.get(`/api/inventory/${id}`);
          if (res.data?.data) {
            applyItemData(res.data.data);
            setIsLoading(false);
          } else {
            throw new Error('Not found');
          }
        } catch (err) {
          console.error('Failed to load item', err);
          error('아이템 정보를 불러오는데 실패했습니다.');
          router.push('/inventory');
        }
      }
    };

    initData();
  }, [id, items, listLoading, applyItemData, error, router, isLoading]);

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
      setPhotoIds(prev => [...prev, ...newFiles.map(() => null)]);
      setPhotoFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const removedId = photoIds[index];
    if (removedId) {
      setDeletedPhotoIds(prev => [...prev, removedId]);
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoIds(prev => prev.filter((_, i) => i !== index));
    // photoFiles는 null-id(새 파일)만 포함 → 새 파일 인덱스 계산 필요
    const newFileIndex = photoIds.slice(0, index).filter(id => id === null).length;
    if (removedId === null) {
      setPhotoFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
  };

  const triggerSmartScan = async () => {
    if (photoFiles.length === 0) {
      error('분석할 새로운 사진이 없습니다.');
      return;
    }

    setIsScanning(true);

    try {
      const formData = new FormData();
      photoFiles.forEach(file => formData.append('images', file));

      const response = await clientApi.post('/api/ai/analyze-product', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      const r = response.data?.data;
      if (r) {
        const pick = <T,>(field: { value: T | null; confidence: number } | null | undefined, threshold: number, fallback: T): T => {
          if (!field) return fallback;
          return field.confidence >= threshold && field.value !== null && field.value !== undefined ? field.value : fallback;
        };
        setCategory(pick(r.category, 0.7, category));
        setName(pick(r.name, 0.75, name));
        setBrand(pick(r.brand, 0.7, brand));
        setFlavor(pick(r.flavor, 0.7, flavor));
        setProductionDate(pick(r.productionDate, 0.8, productionDate));
        setExpiryDateSpecific(pick(r.expiryDateSpecific, 0.8, expiryDateSpecific));
        setExpiryDateText(pick(r.expiryDateText, 0.7, expiryDateText));
        setIngredients(pick(r.ingredients, 0.65, ingredients));
        setMaterial(pick(r.material, 0.7, material));
        setSize(pick(r.size, 0.7, size));
        setStorageMethod(pick(r.storageMethod, 0, storageMethod));
        setSuggestedUsage(pick(r.suggestedUsage, 0.65, suggestedUsage));
      }

      success('AI 분석 완료! 정보를 확인해 주세요.');
    } catch (err: any) {
      error('AI 분석에 실패했습니다.');
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
        deletedFileIds: deletedPhotoIds,
      };
      formData.append('data', JSON.stringify(data));

      const res = await clientApi.patch(`/api/inventory/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data) {
        updateItem(res.data.data);
      }

      success('수정이 완료되었습니다! ✨');
      router.push('/inventory');
    } catch (err) {
      error('수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const isConsumable = ['FOOD', 'SNACK', 'HEALTH'].includes(category);

  if (isLoading && listLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-green/30">
        <div className="w-16 h-16 border-[6px] border-light-yellow border-t-main-yellow rounded-full animate-spin mb-4" />
        <p className="text-text-sub font-black animate-pulse">정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 lg:p-6 shrink-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/inventory')} className="p-2 hover:bg-surface-green rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-text-main" />
            </button>
            <div>
              <h1 className="text-xl font-black text-text-main">정보 수정</h1>
              <p className="text-[11px] font-bold text-text-sub">꼼꼼하게 정보를 업데이트 해주세요.</p>
            </div>
          </div>
          <button 
            type="submit" 
            form="edit-form"
            className="px-8 py-3 bg-main-yellow text-white font-black rounded-2xl shadow-lg shadow-main-yellow/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Save className="w-5 h-5" /> 저장하기
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <form id="edit-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 pb-24">
          
          {/* Main Info Section */}
          <div className="bg-background rounded-[40px] p-8 lg:p-10 border border-border shadow-xl space-y-10">
            <h3 className="text-2xl font-black text-text-main flex items-center gap-3 border-b border-border pb-6">
              <Type className="w-7 h-7 text-main-yellow" /> 기본 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-3">
                <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1">제품명</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="제품 이름을 입력해 주세요" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black text-xl focus:bg-background focus:border-main-yellow transition-all outline-none" />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1">브랜드</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="브랜드명" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1">카테고리</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none appearance-none cursor-pointer">
                    <option value="FOOD">사료</option>
                    <option value="SNACK">간식</option>
                    <option value="TOY">장난감</option>
                    <option value="HEALTH">영양제</option>
                    <option value="CLOTHES">의류</option>
                    <option value="ETC">기타</option>
                  </select>
                  <ChevronLeft className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none text-text-sub" />
                </div>
              </div>
            </div>
          </div>

          {/* Photo Section */}
          <div className="bg-background rounded-[40px] p-8 lg:p-10 border border-border shadow-xl space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-text-main flex items-center gap-3">
                <Camera className="w-6 h-6 text-main-yellow" /> 제품 사진
              </h3>
              {photoFiles.length > 0 && !isScanning && (
                <button 
                  type="button"
                  onClick={triggerSmartScan}
                  className="bg-light-yellow/50 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-black text-main-yellow hover:bg-light-yellow transition-colors border border-main-yellow/20"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 새 사진으로 AI 재분석
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((idx) => (
                <div 
                  key={idx}
                  onClick={photos[idx] ? undefined : handlePhotoClick}
                  className={`relative aspect-square rounded-[32px] border-4 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-2 ${
                    photos[idx] ? 'border-main-yellow bg-background shadow-lg' : 'border-border bg-surface-green/30 hover:border-main-yellow/50 cursor-pointer'
                  }`}
                >
                  {photos[idx] ? (
                    <>
                      <Image src={photos[idx]} alt={`Product ${idx + 1}`} fill className="object-cover" />
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removePhoto(idx); }}
                        className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Camera className="w-10 h-10 text-text-sub/50" />
                      <span className="text-[11px] font-black text-text-sub/60">
                        {idx === 0 ? '대표 사진 등록' : '추가 사진'}
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

            {isScanning && (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 bg-surface-green/20 rounded-[32px] border border-main-yellow/30 animate-pulse">
                <div className="w-12 h-12 border-4 border-light-yellow border-t-main-yellow rounded-full animate-spin" />
                <p className="text-sm font-black text-main-yellow">새로운 사진 정보를 분석하고 있습니다...</p>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="bg-background rounded-[40px] p-8 lg:p-10 border border-border shadow-xl space-y-10">
            <h3 className="text-xl font-black text-text-main flex items-center gap-3">
              <Search className="w-6 h-6 text-main-yellow" /> 상세 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {isConsumable ? (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Tag className="w-4 h-4 text-orange-400" /> 맛/풍미</label>
                    <input type="text" value={flavor} onChange={(e) => setFlavor(e.target.value)} placeholder="예: 닭가슴살, 연어, 오리" className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none" />
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
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Thermometer className="w-4 h-4 text-blue-400" /> 보관방법</label>
                    <div className="relative">
                      <select value={storageMethod} onChange={(e) => setStorageMethod(e.target.value as any)} className="w-full px-8 py-5 bg-surface-green/50 border-2 border-transparent rounded-[24px] font-black focus:bg-background focus:border-main-yellow transition-all outline-none appearance-none cursor-pointer">
                        <option value="ROOM_TEMP">상온보관</option>
                        <option value="REFRIGERATED">냉장보관</option>
                        <option value="FROZEN">냉동보관</option>
                      </select>
                      <ChevronLeft className="w-5 h-5 absolute right-6 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none text-text-sub" />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-sm font-black text-text-sub px-1">주요 성분</label>
                    <div className="flex flex-wrap gap-2 mb-2 p-6 bg-surface-green/30 rounded-[32px] border-2 border-dashed border-border">
                      {ingredients.map((ing, i) => (
                        <span key={i} className="px-5 py-2.5 bg-background border border-border rounded-full text-xs font-black flex items-center gap-2 shadow-sm">
                          {ing} <button type="button" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">×</button>
                        </span>
                      ))}
                      <div className="flex gap-2 w-full mt-2">
                        <input type="text" value={ingredientInput} onChange={(e) => setIngredientInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())} placeholder="성분 직접 추가" className="flex-1 px-6 py-4 bg-background border border-border rounded-2xl font-bold text-sm outline-none focus:border-main-yellow" />
                        <button type="button" onClick={addIngredient} className="px-6 bg-main-yellow text-white rounded-2xl font-black shadow-md hover:scale-105 active:scale-95 transition-all">+</button>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1"><Tag className="w-4 h-4 text-main-green" /> 급여/사용 방법</label>
                    <textarea value={suggestedUsage} onChange={(e) => setSuggestedUsage(e.target.value)} placeholder="예: 체중 5kg 기준 하루 2~3개..." rows={3} className="w-full px-8 py-6 bg-surface-green/50 border-2 border-transparent rounded-[32px] font-bold text-sm focus:bg-background focus:border-main-yellow transition-all outline-none resize-none leading-relaxed" />
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

          {/* Management Section */}
          <div className="bg-background rounded-[40px] p-8 lg:p-10 border border-border shadow-xl space-y-10">
            <h3 className="text-xl font-black text-text-main flex items-center gap-3">
              <Package className="w-6 h-6 text-main-green" /> 관리 설정
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
                <label className="text-sm font-black text-text-sub flex items-center gap-2 px-1">보유 수량</label>
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
                    <p className="text-sm text-text-sub font-bold leading-tight mt-1">지급 중인 제품은 홈 화면에서 빠르게 기록할 수 있습니다.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsFeeding(!isFeeding)} className={`w-20 h-10 rounded-full relative transition-all shadow-inner ${isFeeding ? 'bg-main-green' : 'bg-border'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-background rounded-full transition-all shadow-md ${isFeeding ? 'left-11' : 'left-1.5'}`} />
                </button>
              </div>

              <div className="md:col-span-2 space-y-6 pt-4">
                <label className="text-sm font-black text-text-main flex items-center gap-2 px-1"><Star className="w-6 h-6 text-main-yellow fill-main-yellow" /> 아이의 선호도</label>
                <div className="flex gap-6 p-10 bg-surface-green/30 rounded-[48px] justify-center items-center border-2 border-border shadow-inner">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setRating(s)} className="p-1 transition-all hover:scale-125 active:scale-90">
                      <Star className={`w-14 h-14 ${s <= rating ? 'text-main-yellow fill-main-yellow' : 'text-border fill-border'}`} />
                    </button>
                  ))}
                  <span className="ml-6 text-3xl font-black text-main-yellow">{rating}점</span>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-8 bg-main-yellow text-white font-black rounded-[40px] shadow-2xl shadow-main-yellow/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 text-2xl group">
            <Save className="w-8 h-8 group-hover:rotate-12 transition-transform" /> 정보 수정 완료
          </button>
        </form>
      </div>
    </div>
  );
}
