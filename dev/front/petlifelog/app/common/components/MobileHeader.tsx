'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import Image from 'next/image';

export default function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="lg:hidden h-16 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-[100] px-6 flex items-center justify-between">
      <button 
        onClick={onMenuClick}
        className="p-2.5 bg-sidebar-bg rounded-xl text-text-main hover:bg-main-yellow/20 transition-all active:scale-90"
      >
        <Menu className="w-6 h-6" />
      </button>

      <Link href="/calendar" className="flex items-center gap-2.5">
        <div className="relative w-8 h-8 shrink-0">
          <Image src="/logo_simple.png" alt="Logo" fill className="object-contain" />
        </div>
        <span className="text-lg font-black tracking-tighter text-text-main leading-tight">
          Pet<span className="text-main-green">Life</span>Log
        </span>
      </Link>
      
      <div className="w-11" /> {/* Spacer to balance the layout */}
    </header>
  );
}
