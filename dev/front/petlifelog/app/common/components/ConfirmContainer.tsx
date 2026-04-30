'use client';

import React from 'react';
import { useConfirmStore } from '../hooks/useConfirm';
import { AlertCircle } from 'lucide-react';

export default function ConfirmContainer() {
  const { isOpen, message, onConfirm, onCancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <h3 className="text-xl font-black text-text-main mb-3 tracking-tight">확인해주세요</h3>
        <p className="text-text-sub text-sm font-bold leading-relaxed mb-8">
          {message}
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-background text-text-sub font-black rounded-2xl hover:bg-border transition-all active:scale-95"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-main-yellow text-white font-black rounded-2xl shadow-lg shadow-main-yellow/20 hover:scale-105 transition-all active:scale-95"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
