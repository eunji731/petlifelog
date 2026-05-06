'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Star, Sparkles, Calendar, ShoppingBag, X, Tag } from 'lucide-react';
import { useInventory, InventoryItem } from '@/app/common/hooks/useInventory';
import { useToast } from '@/app/common/hooks/useToast';

export default function InventoryPage() {
  const { items, addItem, removeItem } = useInventory();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'ALL' | 'SNACK' | 'TOY' | 'HEALTH' | 'CLOTHES'>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const photoUrl = URL.createObjectURL(files[0]);
      triggerAIScan(photoUrl);
    }
    e.target.value = '';
  };

  const triggerAIScan = (photoUrl: string) => {
    setIsScanning(true);
    // Simulate AI Scan & OCR
    setTimeout(() => {
      const newItem: InventoryItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        name: '유기농 동결건조 북어 트릿',
        category: 'SNACK',
        photo: photoUrl,
        brand: '더독(The Dog)',
        expiryDate: '2027-12-31',
        recommendedAmount: '5kg 기준 3-5조각',
        rating: 5,
        addedAt: new Date().toISOString().split('T')[0]
      };
      addItem(newItem);
      success('AI가 제품 정보를 성공적으로 스캔했습니다! ✨');
      setIsScanning(false);
    }, 3000);
  };

  const filteredItems = activeTab === 'ALL' ? items : items.filter(i => i.category === activeTab);

  const tabs = [
    { label: '전체', value: 'ALL' },
    { label: '간식', value: 'SNACK' },
    { label: '장난감', value: 'TOY' },
    { label: '건강/영양', value: 'HEALTH' },
    { label: '옷/액세서리', value: 'CLOTHES' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-border p-6 lg:p-10 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="text-xs font-black text-main-yellow tracking-widest uppercase mb-1 block">Smart Inventory</span>
            <h1 className="text-3xl lg:text-4xl font-black text-text-main tracking-tight">아이의 보물창고</h1>
            <p className="text-text-sub text-sm lg:text-base font-bold mt-2">
              사진 스캔으로 간식과 장난감을 스마트하게 관리하세요.
            </p>
          </div>
          
          <div className="flex gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
            <button 
              onClick={handleScanClick}
              disabled={isScanning}
              className="flex items-center gap-2 px-8 py-4 bg-main-yellow text-white font-black rounded-2xl shadow-lg shadow-main-yellow/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" /> 스캔 중...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" /> 제품 스캔하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-border shrink-0">
        <div className="max-w-6xl mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-8">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`py-4 text-sm font-black transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.value 
                    ? 'border-main-yellow text-main-yellow' 
                    : 'border-transparent text-text-sub hover:text-text-main'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          {isScanning && (
            <div className="mb-8 p-12 bg-white rounded-[32px] border-2 border-dashed border-main-yellow/30 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-light-yellow border-t-main-yellow rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-main-yellow" />
              </div>
              <div>
                <h3 className="text-xl font-black text-text-main">AI가 제품을 분석하고 있어요</h3>
                <p className="text-text-sub font-medium">이름, 유통기한, 권장 급여량을 자동으로 추출 중입니다.</p>
              </div>
            </div>
          )}

          {filteredItems.length === 0 && !isScanning ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-light-yellow rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-main-yellow" />
              </div>
              <h3 className="text-xl font-black text-text-main">도감이 텅 비어있어요</h3>
              <p className="text-text-sub mt-2 font-medium">제품 사진을 찍어 스마트하게 등록해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-[32px] border border-border overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Photo */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image src={item.photo} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 bg-white/90 backdrop-blur-md text-[10px] font-black rounded-full shadow-sm ${
                        item.category === 'SNACK' ? 'text-amber-500' : 'text-blue-500'
                      }`}>
                        {item.category === 'SNACK' ? '간식' : item.category === 'TOY' ? '장난감' : '아이템'}
                      </span>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <div className="text-[10px] font-black text-text-sub mb-1">{item.brand || 'Brand'}</div>
                    <h3 className="text-lg font-black text-text-main mb-3 line-clamp-1">{item.name}</h3>
                    
                    <div className="space-y-2 mb-4">
                      {item.expiryDate && (
                        <div className="flex items-center gap-2 text-[11px] font-bold text-text-sub">
                          <Calendar className="w-3.5 h-3.5 text-main-yellow" />
                          유통기한: {item.expiryDate}
                        </div>
                      )}
                      {item.recommendedAmount && (
                        <div className="flex items-center gap-2 text-[11px] font-bold text-text-sub">
                          <Tag className="w-3.5 h-3.5 text-main-green" />
                          급여량: {item.recommendedAmount}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < item.rating ? 'text-main-yellow fill-main-yellow' : 'text-border fill-border'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-black text-text-sub bg-surface-green px-2 py-1 rounded-md">
                        {item.addedAt}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
