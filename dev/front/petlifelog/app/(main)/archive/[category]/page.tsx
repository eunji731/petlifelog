'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  ArrowUpRight
} from 'lucide-react';
import { useArchive, ArchivePhoto } from '@/app/common/hooks/useArchive';

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function ThemeDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { category: encodedCategory } = use(params);
  const category = decodeURIComponent(encodedCategory);
  const { getTheme, getPhotosByTag } = useArchive();

  const theme = getTheme(category);
  const [photos, setPhotos] = useState<ArchivePhoto[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    getPhotosByTag(category).then(setPhotos);
  }, [category]);

  if (!theme) {
    return (
      <div className="p-10 flex items-center justify-center h-full text-text-sub">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">테마를 불러오는 중...</p>
          <p className="text-sm">잠시만 기다려 주세요.</p>
        </div>
      </div>
    );
  }

  const bestPhoto = photos.find(p => p.isBest) || photos[0];

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-white text-text-main">
      {/* Hero Section */}
      <section className="relative h-[75vh] w-full overflow-hidden bg-black">
        {bestPhoto && (
          <Image
            src={bestPhoto.path}
            alt="Featured"
            fill
            className="object-cover opacity-70 transition-all duration-1000"
            priority
          />
        )}

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-white/70 hover:text-white transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-main-green group-hover:border-main-green transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Go Back</span>
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-main-yellow hover:text-black hover:border-main-yellow transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 p-12 flex flex-col justify-end pointer-events-none">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-main-green">Collection Vol. 01</span>
              <div className="h-[1px] w-12 bg-main-green/50" />
              {bestPhoto && (
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">{bestPhoto.date}</span>
              )}
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter mb-8 uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
              {theme.categoryName}
            </h1>

            <div className="flex flex-col gap-3 items-start text-white/70 bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-white/10 w-fit">
              {bestPhoto && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-main-yellow" />
                  <span className="text-[11px] font-black uppercase tracking-widest">{bestPhoto.date}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-12 bg-white relative">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-main-green" />
              <span className="text-[10px] font-black text-text-sub uppercase tracking-[0.5em]">AI Insight Report</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter uppercase mb-6 text-text-main">
              PERFECT <span className="text-main-green opacity-20 outline-text">HARMONY.</span>
            </h3>
            <p className="text-lg text-text-sub leading-relaxed max-w-sm font-medium">
              AI가 분석한 결과, {theme.categoryName} 테마에서 엄선된 순간들이 모였습니다. 총 {theme.photoCount}개의 사진이 담겨 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="aspect-[2/1] bg-surface-green rounded-[40px] p-6 md:p-8 flex flex-col justify-between border border-main-green/10">
              <span className="text-[11px] font-black uppercase tracking-widest text-main-green">Total Moments</span>
              <span className="text-6xl md:text-7xl font-black text-text-main leading-none">{theme.photoCount}</span>
            </div>
            <div className="aspect-[2/1] bg-main-yellow rounded-[40px] p-6 md:p-8 flex flex-col justify-between shadow-xl shadow-main-yellow/20">
              <span className="text-[11px] font-black uppercase tracking-widest text-black/40">Vibe Score</span>
              <span className="text-6xl md:text-7xl font-black text-black leading-none">A+</span>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="px-4 md:px-8 pt-16 pb-32 bg-surface-green/30">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-baseline gap-4">
            <h2 className="text-[12px] font-black text-text-main uppercase tracking-[0.5em]">Selected Fragments</h2>
            <span className="text-main-green font-black text-xs">/ {photos.length}</span>
          </div>
          <div className="h-[2px] flex-1 bg-main-green/10 w-full md:w-auto" />
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-main-yellow" />
            <span className="text-[10px] font-black text-text-sub uppercase tracking-widest font-mono">Archive Edt.</span>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-20 text-text-sub">
            <p className="text-sm font-bold">사진을 불러오는 중...</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-3 gap-8 space-y-8">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className="relative bg-white p-5 rounded-[32px] shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer group border border-border break-inside-avoid-column"
              >
                <div className="relative overflow-hidden rounded-[24px]">
                  <img
                    src={photo.path}
                    alt={`Fragment ${index}`}
                    className="w-full h-auto transition-transform duration-1000 group-hover:scale-110"
                  />
                </div>
                <div className="pt-8 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-black text-main-green uppercase tracking-widest">
                        FRAG. {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="h-[1px] w-4 bg-main-green/30" />
                    </div>
                    {photo.photoComment && (
                      <p className="text-[13px] font-bold leading-relaxed text-text-main group-hover:text-main-green transition-colors uppercase tracking-tight">
                        "{photo.photoComment}"
                      </p>
                    )}
                  </div>
                  {photo.vibeScore > 0 && (
                    <div className="flex gap-1 mt-1.5 ml-4">
                      {Array.from({ length: photo.vibeScore }).map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-main-yellow rounded-full shadow-sm" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Share Modal */}
      {isShareModalOpen && bestPhoto && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 transition-all animate-in fade-in duration-300">
          <div className="w-full max-w-[400px] aspect-[9/16] bg-white relative shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden rounded-[40px]">
            <Image src={bestPhoto.path} alt="Poster" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />

            <div className="absolute inset-0 p-10 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-main-green p-3 rounded-2xl shadow-lg">
                  <Image src="/logo_simple.png" alt="Logo" width={24} height={24} />
                </div>
                <div className="bg-main-yellow px-4 py-1.5 rounded-full shadow-lg">
                  <span className="text-[9px] font-black text-black uppercase tracking-[0.2em]">EDITION 2026</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-[2px] w-8 bg-main-green" />
                  <span className="text-[10px] font-black text-main-green uppercase tracking-[0.4em]">Special Archive</span>
                </div>
                <h2 className="text-6xl font-black text-white leading-[0.9] tracking-tighter uppercase">{theme.categoryName}</h2>
                <div className="flex justify-between items-end pt-8 border-t border-white/10">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-white/40 tracking-[0.3em] uppercase">{bestPhoto.date}</span>
                    <span className="text-[10px] font-black text-main-green tracking-widest uppercase">@PETLIFELOG</span>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex gap-4">
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="px-8 py-4 bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              className="px-12 py-4 bg-main-green text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-main-green/20 hover:scale-105 transition-all active:scale-95"
              onClick={() => {
                alert('POSTER SAVED.');
                setIsShareModalOpen(false);
              }}
            >
              Save Poster
            </button>
          </div>
        </div>
      )}

      {/* Expanded View Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-xl flex flex-col items-center justify-center transition-all animate-in fade-in duration-300"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-main-green" />
              <span className="text-[11px] font-black tracking-[0.5em] uppercase text-white/40">Fragment {selectedPhotoIndex + 1} / {photos.length}</span>
            </div>
            <button onClick={() => setSelectedPhotoIndex(null)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative w-full h-[60vh] flex items-center justify-center px-4">
            <Image
              src={photos[selectedPhotoIndex].path}
              alt="Expanded"
              fill
              className="object-contain"
            />

            <button onClick={handlePrevPhoto} className="absolute left-8 w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-main-green transition-all group">
              <ChevronLeft className="w-8 h-8 transition-transform group-hover:-translate-x-1" />
            </button>
            <button onClick={handleNextPhoto} className="absolute right-8 w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-main-green transition-all group">
              <ChevronRight className="w-8 h-8 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="w-full max-w-3xl mt-16 px-8 flex flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] w-12 bg-main-yellow/30" />
              <span className="text-[10px] font-black text-main-yellow uppercase tracking-[0.4em]">AI Analysis</span>
              <div className="h-[1px] w-12 bg-main-yellow/30" />
            </div>

            {photos[selectedPhotoIndex].photoComment && (
              <p className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-[1.1] mb-12">
                "{photos[selectedPhotoIndex].photoComment}"
              </p>
            )}

            <button
              onClick={() => router.push(`/timeline?date=${photos[selectedPhotoIndex].diaryDateKey}`)}
              className="group flex items-center gap-4 px-12 py-6 bg-main-green text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-main-green/30 transition-all hover:scale-105 active:scale-95"
            >
              Discover Full Story
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .outline-text {
          -webkit-text-stroke: 1px currentColor;
          color: transparent;
        }
      `}</style>
    </div>
  );
}
