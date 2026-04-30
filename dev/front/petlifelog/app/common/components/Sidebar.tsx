'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Calendar,
  Image as ImageIcon,
  MapPin,
  Book,
  FileText,
  Settings,
  ChevronDown,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import Image from 'next/image';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

const navItems = [
  { name: '캘린더', href: '/calendar', icon: Calendar },
  { name: '타임라인', href: '/timeline', icon: ImageIcon },
  { name: '지도', href: '/map', icon: MapPin },
  { name: '도감', href: '/inventory', icon: Book },
  { name: '기록', href: '/record', icon: FileText },
  { name: '설정', href: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        const { kakaoLogoutUrl } = await res.json();
        window.location.href = kakaoLogoutUrl;
        return;
      }
    } catch {
      // 네트워크 오류 시 fallback
    }

    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar-bg">
      <div className="p-5 lg:p-6 flex items-center justify-between border-b border-main-yellow/10">
        <Link href="/calendar" className="flex items-center gap-2" onClick={onClose}>
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="text-lg font-black tracking-tighter text-text-main leading-tight">
            Pet<span className="text-main-green">Life</span>Log
          </span>
        </Link>
        <button onClick={onClose} className="lg:hidden p-2 text-text-main hover:bg-main-yellow/20 rounded-lg">
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 px-3 lg:px-4 py-6 space-y-1 lg:space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-main-green text-white shadow-lg shadow-main-green/20 font-bold' 
                  : 'text-text-main/70 hover:bg-main-yellow/30 hover:text-text-main'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-main-green'}`} />
              <span className="text-[15px] font-bold tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 lg:p-4 border-t border-main-yellow/10 space-y-2">
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-sub hover:bg-red-50 hover:text-red-500 transition-all group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-[14px] font-bold tracking-tight">로그아웃</span>
        </button>

        {/* Pet Profile Card */}
        <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-main-yellow/5">
          <div className="w-10 h-10 rounded-full bg-main-green/20 relative overflow-hidden ring-2 ring-white shadow-sm shrink-0">
            <Image src="/dog-profile.png" alt="Profile" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-sm text-text-main truncate">봉봉이</div>
            <div className="text-[10px] text-text-sub font-bold truncate">말티푸 · 2세</div>
          </div>
          <button className="p-1 text-text-sub hover:text-text-main">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[220px] h-screen sticky top-0 border-r border-border shrink-0">
        <SidebarContent />
      </aside>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[120] flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
          <aside className="relative w-[85%] max-w-[320px] h-full shadow-2xl animate-in slide-in-from-left duration-500">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
