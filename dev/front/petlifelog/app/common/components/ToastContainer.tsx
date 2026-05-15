'use client';

import React from 'react';
import { useToastStore } from '../hooks/useToast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-[400px] px-6 pointer-events-none">
      {toasts.map((toast) => {
        const config = {
          success: { icon: <CheckCircle2 className="w-5 h-5 text-main-green" />, bg: 'bg-white dark:bg-zinc-800', border: 'border-main-green/20 dark:border-main-green/30' },
          error: { icon: <AlertCircle className="w-5 h-5 text-red-500" />, bg: 'bg-white dark:bg-zinc-800', border: 'border-red-100 dark:border-red-900/40' },
          info: { icon: <Info className="w-5 h-5 text-blue-500" />, bg: 'bg-white dark:bg-zinc-800', border: 'border-blue-50 dark:border-blue-900/40' },
          warning: { icon: <AlertTriangle className="w-5 h-5 text-main-yellow" />, bg: 'bg-white dark:bg-zinc-800', border: 'border-main-yellow/20 dark:border-main-yellow/30' },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] border ${config.border} ${config.bg} animate-in slide-in-from-top-4 fade-in duration-300`}
          >
            <div className="shrink-0">{config.icon}</div>
            <p className="flex-1 text-sm font-black text-text-main tracking-tight leading-tight">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-text-sub hover:text-text-main transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
