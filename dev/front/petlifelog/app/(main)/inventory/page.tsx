'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Plus, Star, ShoppingBag, X, Calendar, Tag, Package, Activity, Pencil } from 'lucide-react';
import { useInventory } from '@/app/common/hooks/useInventory';
import { getImagePath } from '@/app/common/lib/clientApi';

export default function InventoryPage() {
  const router = useRouter();
  const { items, loading, fetchItems, removeItem, toggleFeeding } = useInventory();

  useEffect(() => {
    fetchItems();
  }, []);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FOOD' | 'SNACK' | 'TOY' | 'HEALTH' | 'CLOTHES' | 'ETC'>('ALL');

  const filteredItems = activeTab === 'ALL' ? items : items.filter(i => i.category === activeTab);

  const tabs = [
    { label: '전체', value: 'ALL' },
    { label: '사료', value: 'FOOD' },
    { label: '간식', value: 'SNACK' },
    { label: '장난감', value: 'TOY' },
    { label: '건강/영양', value: 'HEALTH' },
    { label: '옷/액세서리', value: 'CLOTHES' },
    { label: '기타', value: 'ETC' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface-green/30 overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border p-6 lg:p-10 shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="text-xs font-black text-main-yellow tracking-widest uppercase mb-1 block">Smart Inventory</span>
            <h1 className="text-3xl lg:text-4xl font-black text-text-main tracking-tight">아이의 보물창고</h1>
            <p className="text-text-sub text-sm lg:text-base font-bold mt-2">
              AI 스캔으로 정보를 자동 입력하고 재고를 스마트하게 관리하세요.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/inventory/register')}
              className="flex items-center gap-2 px-8 py-4 bg-main-yellow text-white font-black rounded-2xl shadow-lg shadow-main-yellow/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" /> 등록
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-background border-b border-border shrink-0">
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
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-main-yellow/10 border-t-main-yellow rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-main-yellow/10 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-main-yellow" />
              </div>
              <h3 className="text-xl font-black text-text-main">도감이 텅 비어있어요</h3>
              <p className="text-text-sub mt-2 font-medium">제품을 등록해 스마트하게 관리해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-background rounded-[32px] border transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                    item.isFeeding ? 'border-main-green/50 ring-2 ring-main-green/10' : 'border-border'
                  }`}
                >
                  {/* Photo */}
                  <div 
                    className="relative aspect-square overflow-hidden bg-main-yellow/5 cursor-pointer"
                    onClick={() => router.push(`/inventory/edit/${item.id}`)}
                  >
                    {item.photo ? (
                      <Image src={getImagePath(item.photo)} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-main-yellow/20" />
                      </div>
                    )}
                    
                    {/* Status Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className={`px-3 py-1.5 bg-background/90 backdrop-blur-md text-[10px] font-black rounded-full shadow-sm ${
                        item.category === 'FOOD' ? 'text-orange-500' :
                        item.category === 'SNACK' ? 'text-amber-500' :
                        item.category === 'TOY' ? 'text-blue-500' :
                        item.category === 'HEALTH' ? 'text-emerald-500' :
                        item.category === 'CLOTHES' ? 'text-purple-500' : 'text-text-sub'
                      }`}>
                        {tabs.find(t => t.value === item.category)?.label || '아이템'}
                      </span>
                      {item.isFeeding && (
                        <span className="px-3 py-1.5 bg-main-green text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                          <Activity className="w-3 h-3" /> 지급 중
                        </span>
                      )}
                    </div>

                    {/* Stock Badge */}
                    <div className="absolute bottom-4 right-4">
                      <span className={`px-3 py-1.5 backdrop-blur-md text-[11px] font-black rounded-xl shadow-sm border ${
                        item.stock <= 2 ? 'bg-red-50 dark:bg-red-900/10 text-red-500 border-red-100 dark:border-red-900/20' : 'bg-background/90 text-text-main border-border/20'
                      }`}>
                        재고 {item.stock}개
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/inventory/edit/${item.id}`);
                        }}
                        className="p-2 bg-background/80 backdrop-blur-md text-text-main rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-main-yellow hover:text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="p-2 bg-black/30 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="text-[10px] font-black text-text-sub mb-0.5">{item.brand || 'Brand'}</div>
                    <h3 className="text-base font-black text-text-main mb-3 line-clamp-1">{item.name}</h3>

                    {/* Size + StorageMethod */}
                    {(item.size || item.storageMethod) && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                        {item.size && (
                          <span className="px-2.5 py-1 bg-surface-green/70 text-[10px] font-black text-text-main rounded-lg">
                            {item.size}
                          </span>
                        )}
                        {item.storageMethod && (
                          <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${
                            item.storageMethod === 'REFRIGERATED' ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600' :
                            item.storageMethod === 'FROZEN' ? 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600' :
                            'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600'
                          }`}>
                            {item.storageMethod === 'REFRIGERATED' ? '냉장' :
                             item.storageMethod === 'FROZEN' ? '냉동' : '상온'}
                          </span>
                        )}
                        {item.material && (
                          <span className="px-2.5 py-1 bg-surface-green/70 text-[10px] font-black text-text-main rounded-lg">
                            {item.material}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Expiry */}
                    {(item.expiryDateSpecific || item.expiryDateText) && (
                      <div className="mb-2.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                        {item.expiryDateSpecific && (
                          <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-700 dark:text-amber-500">
                            <Calendar className="w-3 h-3 shrink-0" />
                            유통: {item.expiryDateSpecific}
                          </div>
                        )}
                        {item.expiryDateText && (
                          <div className="text-[10px] font-bold text-amber-500 mt-0.5 pl-4">{item.expiryDateText}</div>
                        )}
                      </div>
                    )}

                    {/* Ingredients */}
                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {item.ingredients.slice(0, 3).map((ing, i) => (
                          <span key={i} className="px-2 py-0.5 bg-surface-green/50 text-[9px] font-bold text-text-sub rounded-full border border-border/40 line-clamp-1 max-w-[80px] truncate">
                            {ing}
                          </span>
                        ))}
                        {item.ingredients.length > 3 && (
                          <span className="px-2 py-0.5 bg-border/30 text-[9px] font-black text-text-sub rounded-full">
                            +{item.ingredients.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Suggested Usage */}
                    {item.suggestedUsage && (
                      <p className="text-[10px] text-text-sub font-medium mb-2.5 line-clamp-2 leading-relaxed px-2.5 py-2 bg-surface-green/30 rounded-lg">
                        {item.suggestedUsage}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < item.rating ? 'text-main-yellow fill-main-yellow' : 'text-border fill-border'}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => toggleFeeding(item.id)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all ${
                          item.isFeeding
                            ? 'bg-main-green text-white shadow-md shadow-main-green/20'
                            : 'bg-surface-green dark:bg-white/5 text-text-sub border border-border hover:border-main-green/50'
                        }`}
                      >
                        {item.isFeeding ? '지급 중지' : '지급 시작'}
                      </button>
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
