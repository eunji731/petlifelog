'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Image as ImageIcon,
  MapPin,
  LayoutDashboard,
  FileText,
  Settings,
  ChevronDown,
  X,
  LogOut,
  Users,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { usePet, PetProfile, ALL_PETS_ID } from '../hooks/usePet';
import clientApi, { getImagePath } from '../lib/clientApi';

const navItems = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '캘린더', href: '/calendar', icon: Calendar },
  { name: '아카이브', href: '/archive', icon: ImageIcon },
  { name: '가족 관리', href: '/family', icon: Users },
  { name: '지도', href: '/map', icon: MapPin },
  { name: '기록', href: '/record', icon: FileText },
  { name: '설정', href: '/settings', icon: Settings },
];

interface SidebarContentProps {
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
}

const SidebarContent = ({ pathname, onClose, onLogout }: SidebarContentProps) => {
  const { pets, selectedPetId, setSelectedPetId } = usePet();
  const [isPetSwitcherOpen, setIsPetSwitcherOpen] = React.useState(false);

  const primaryPet = pets.find(p => p.id === selectedPetId);

  return (
    <div className="flex flex-col h-full bg-sidebar-bg">
      <div className="p-5 lg:p-6 flex items-center justify-between border-b border-main-yellow/10">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="relative w-8 h-8 shrink-0">
            <Image src="/logo_simple.png" alt="Logo" fill sizes="32px" className="object-contain" />
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
          const isActive = (item.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) || 
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href === '/dashboard' ? '/' : item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-main-green text-white shadow-lg shadow-main-green/20 font-bold' 
                  : 'text-text-main/70 hover:bg-main-green/5 hover:text-main-green'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-main-green transition-colors'}`} />
              <span className={`text-[15px] font-bold tracking-tight ${isActive ? 'text-white' : 'group-hover:text-main-green'}`}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 lg:p-4 border-t border-main-yellow/10 space-y-2 relative">
        {/* Pet Switcher Dropdown */}
        {isPetSwitcherOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200">
            <div className="p-3 border-b border-border bg-surface-green/30">
              <span className="text-[10px] font-black text-main-green uppercase tracking-widest">가족 선택</span>
            </div>
            <div className="max-h-64 overflow-y-auto no-scrollbar">
              {/* All Pets Option */}
              <button
                onClick={() => {
                  setSelectedPetId(ALL_PETS_ID);
                  setIsPetSwitcherOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 hover:bg-surface-green transition-all ${selectedPetId === ALL_PETS_ID ? 'bg-main-green/5' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-main-green flex items-center justify-center shrink-0 border border-white text-white">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className={`font-bold text-sm truncate ${selectedPetId === ALL_PETS_ID ? 'text-main-green' : 'text-text-main'}`}>모든 가족</div>
                  <div className="text-[9px] text-text-sub font-medium truncate">전체 기록 보기</div>
                </div>
                {selectedPetId === ALL_PETS_ID && <div className="w-1.5 h-1.5 rounded-full bg-main-green" />}
              </button>

              {pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => {
                    setSelectedPetId(pet.id);
                    setIsPetSwitcherOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-surface-green transition-all ${selectedPetId === pet.id ? 'bg-main-green/5' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-main-green/10 relative overflow-hidden shrink-0 border border-white">
                    <Image src={getImagePath(pet.photo, 'profiles')} alt={pet.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className={`font-bold text-sm truncate ${selectedPetId === pet.id ? 'text-main-green' : 'text-text-main'}`}>{pet.name}</div>
                    <div className="text-[9px] text-text-sub font-medium truncate">{pet.breed}</div>
                  </div>
                  {selectedPetId === pet.id && <div className="w-1.5 h-1.5 rounded-full bg-main-green" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-sub hover:bg-red-50 hover:text-red-500 transition-all group"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-[14px] font-bold tracking-tight">로그아웃</span>
        </button>

        {selectedPetId === ALL_PETS_ID ? (
          <div 
            onClick={() => pets.length > 0 && setIsPetSwitcherOpen(!isPetSwitcherOpen)}
            className={`flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-main-yellow/5 hover:bg-white transition-all shadow-sm group cursor-pointer ${isPetSwitcherOpen ? 'ring-2 ring-main-green' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-main-green flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm text-white">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm text-text-main truncate group-hover:text-main-green transition-colors">모든 가족</div>
              <div className="text-[10px] text-text-sub font-bold truncate">가족 전체 관리 중</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-text-sub group-hover:text-main-green transition-all ${isPetSwitcherOpen ? 'rotate-180' : ''}`} />
          </div>
        ) : primaryPet ? (
          <div 
            onClick={() => pets.length > 0 && setIsPetSwitcherOpen(!isPetSwitcherOpen)}
            className={`flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-main-yellow/5 hover:bg-white transition-all shadow-sm group cursor-pointer ${isPetSwitcherOpen ? 'ring-2 ring-main-green' : ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-main-green/20 relative overflow-hidden ring-2 ring-white shadow-sm shrink-0">
              <Image src={getImagePath(primaryPet.photo, 'profiles')} alt={primaryPet.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm text-text-main truncate group-hover:text-main-green transition-colors">{primaryPet.name}</div>
              <div className="text-[10px] text-text-sub font-bold truncate">{primaryPet.breed} · {primaryPet.birthDate}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-text-sub group-hover:text-main-green transition-all ${isPetSwitcherOpen ? 'rotate-180' : ''}`} />
          </div>
        ) : (
          <Link 
            href="/family"
            onClick={onClose}
            className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-dashed border-main-yellow/30 hover:bg-white transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-light-yellow flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5 text-main-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm text-text-sub truncate">아이 등록하기</div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { success } = useToast();
  const { confirm } = useConfirm();

  const handleLogout = async () => {
    const isConfirmed = await confirm('로그아웃 하시겠습니까?');
    if (!isConfirmed) return;

    try {
      const res = await clientApi.post('/api/auth/logout');
      const kakaoLogoutUrl = res.data?.data?.kakaoLogoutUrl;
      if (kakaoLogoutUrl) {
        window.location.href = kakaoLogoutUrl;
        return;
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }

    success('안전하게 로그아웃되었습니다.');
    router.push('/login');
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[220px] h-screen sticky top-0 border-r border-border shrink-0">
        <SidebarContent 
          pathname={pathname} 
          onClose={onClose} 
          onLogout={handleLogout} 
        />
      </aside>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[120] flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
          <aside className="relative w-[85%] max-w-[320px] h-full shadow-2xl animate-in slide-in-from-left duration-500">
            <SidebarContent 
              pathname={pathname} 
              onClose={onClose} 
              onLogout={handleLogout} 
            />
          </aside>
        </div>
      )}
    </>
  );
}
