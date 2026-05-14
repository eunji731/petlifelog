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
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useArchive, ArchivePhoto, ArchiveTheme } from '@/app/common/hooks/useArchive';

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function ThemeDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { category: encodedCategory } = use(params);
  const category = decodeURIComponent(encodedCategory);
  const { getTheme, fetchThemeDetail, getPhotosByTag } = useArchive();

  const [theme, setTheme] = useState<ArchiveTheme | null>(null);
  const [photos, setPhotos] = useState<ArchivePhoto[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true);

      // 1. 먼저 로컬 리스트에서 찾아보고 없으면 서버에서 직접 가져옴
      let targetTheme: ArchiveTheme | null | undefined = getTheme(category);
      if (!targetTheme) {
        targetTheme = await fetchThemeDetail(category);
      }

      if (targetTheme) {
        setTheme(targetTheme);
        const fetchedPhotos = await getPhotosByTag(category);
        setPhotos(fetchedPhotos);
      }

      setIsInitialLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  if (isInitialLoading) {
    return (
      <div className="p-10 flex items-center justify-center h-full text-text-sub">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-main-green/20 border-t-main-green rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-bold mb-2">추억의 조각들을 모으는 중...</p>
          <p className="text-sm">잠시만 기다려 주세요.</p>
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full text-text-sub">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-surface-green rounded-full flex items-center justify-center mx-auto">
            <X className="w-10 h-10 text-main-green opacity-40" />
          </div>
          <div>
            <p className="text-lg font-bold mb-2">해당 테마를 찾을 수 없습니다.</p>
            <p className="text-sm">검색어나 태그를 다시 확인해 주세요.</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-main-green text-white font-black rounded-full shadow-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const bestPhoto = photos.find(p => p.isBest) || photos[0];

  // 바이브 스코어 평균 및 등급 계산
  const avgVibeScore = photos.length > 0
    ? photos.reduce((acc, p) => acc + p.vibeScore, 0) / photos.length
    : 0;

  const getVibeGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    return 'C';
  };

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
    <div className="h-full overflow-y-auto no-scrollbar bg-background text-text-main">
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
          {/* <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-main-yellow hover:text-text-main hover:border-main-yellow transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button> */}
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

      <section className="px-8 py-12 bg-background relative">
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
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-black uppercase tracking-widest text-black/40">Vibe Score</span>
                <span className="text-[10px] font-bold text-black/60 bg-black/5 px-2 py-0.5 rounded-full">AVG {avgVibeScore.toFixed(1)}</span>
              </div>
              <span className="text-6xl md:text-7xl font-black text-black leading-none">{getVibeGrade(avgVibeScore)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section - Editorial Gallery Style */}
      <section className="px-4 md:px-12 py-24 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-main-green" />
                <span className="text-[10px] font-black text-main-green uppercase tracking-[0.4em]">Visual Archive</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-text-main uppercase tracking-tighter leading-none">Selected <br />Fragments.</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-text-sub/40 uppercase tracking-widest">Collection Size</span>
                <span className="text-2xl font-black text-text-main tracking-tighter">{photos.length.toString().padStart(2, '0')}</span>
              </div>
              <div className="w-[1px] h-12 bg-border" />
              <div className="bg-surface-green/30 px-5 py-2.5 rounded-full border border-main-green/5">
                <span className="text-[10px] font-black text-main-green uppercase tracking-widest font-mono">Curated by AI</span>
              </div>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-20 text-text-sub">
              <p className="text-sm font-bold">사진을 불러오는 중...</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-6 space-y-6">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className="relative group cursor-pointer break-inside-avoid-column"
                >
                  <div className="relative overflow-hidden rounded-[32px] bg-surface-green/10 shadow-sm transition-all duration-700 group-hover:shadow-2xl">
                    <img
                      src={photo.path}
                      alt={`Fragment ${index}`}
                      className="w-full h-auto transition-transform duration-1000 group-hover:scale-110"
                    />

                    {/* Polished Information Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-4 text-center">
                      <div className="space-y-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 w-full">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[8px] font-black text-main-green uppercase tracking-[0.4em] border border-main-green/30 px-2 py-0.5 rounded">
                            Fragment {index + 1}
                          </span>
                          {photo.vibeScore > 0 && (
                            <div className="flex items-center gap-1 bg-main-yellow/90 px-2 py-0.5 rounded text-[8px] font-black text-black">
                              <Sparkles className="w-2 h-2" /> VIBE {photo.vibeScore.toFixed(1)}
                            </div>
                          )}
                        </div>

                        {photo.photoComment && (
                          <p className="text-sm font-bold leading-tight text-white uppercase tracking-tight line-clamp-3 px-2">
                            &quot;{photo.photoComment}&quot;
                          </p>
                        )}

                        <div className="pt-3 flex flex-col items-center gap-1 border-t border-white/10 mx-4">
                          <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{photo.date}</span>
                          <span className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate max-w-full">@ {photo.locationName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>)}
        </div>
      </section>

      {/* Share Modal */}
      {isShareModalOpen && bestPhoto && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 transition-all animate-in fade-in duration-300">
          <div className="w-full max-w-[400px] aspect-[9/16] bg-background relative shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden rounded-[40px]">
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
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-text-main">
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

      {/* Expanded View Modal - Redesigned to Premium Gallery Style */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-background/90 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-text-sub hover:text-text-main hover:bg-foreground/10 transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="w-full max-w-7xl h-full md:h-[80vh] bg-background rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side: Photo Gallery - Immersive Full View */}
            <div className="relative flex-[1.2] bg-surface-green flex items-center justify-center group overflow-hidden">
              <Image
                src={photos[selectedPhotoIndex].path}
                alt="Expanded"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                priority
              />

              {/* Subtle Overlay for better text/button readability */}
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />

              {/* Fragment Index Indicator - Overlaid on top */}
              <div className="absolute top-8 left-8 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 z-10">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white drop-shadow-sm">
                  Fragment {selectedPhotoIndex + 1} / {photos.length}
                </span>
              </div>

              {/* Navigation Controls */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 md:px-8 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                <button
                  onClick={handlePrevPhoto}
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center text-white hover:bg-main-green hover:border-main-green transition-all pointer-events-auto active:scale-90"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={handleNextPhoto}
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center text-white hover:bg-main-green hover:border-main-green transition-all pointer-events-auto active:scale-90"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Right Side: Content & Story */}
            <div className="flex-1 p-8 md:p-16 flex flex-col justify-between bg-background border-l border-border">
              <div className="space-y-12">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-main-green" />
                      <span className="text-[10px] font-black text-main-green uppercase tracking-[0.4em]">Memory Fragment</span>
                    </div>
                    <h3 className="text-3xl font-black text-text-main uppercase tracking-tighter">
                      {theme.categoryName}
                    </h3>
                  </div>
                  {photos[selectedPhotoIndex].vibeScore > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-text-sub uppercase tracking-widest mb-1">Vibe Score</span>
                      <div className="bg-main-yellow px-3 py-1 rounded-lg text-sm font-black text-black flex items-center gap-1.5 shadow-lg shadow-main-yellow/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        {photos[selectedPhotoIndex].vibeScore.toFixed(1)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-border" />
                    <span className="text-[10px] font-black text-text-sub/30 uppercase tracking-[0.4em]">AI Analysis</span>
                    <div className="h-[1px] flex-1 bg-border" />
                  </div>

                  {photos[selectedPhotoIndex].photoComment ? (
                    <blockquote className="relative">
                      <span className="absolute -top-6 -left-4 text-6xl text-main-green/10 font-serif leading-none">&ldquo;</span>
                      <p className="text-2xl md:text-3xl font-black text-text-main leading-[1.3] tracking-tight relative z-10">
                        {photos[selectedPhotoIndex].photoComment}
                      </p>
                      <span className="absolute -bottom-10 -right-2 text-6xl text-main-green/10 font-serif leading-none transform rotate-180">&ldquo;</span>
                    </blockquote>
                  ) : (
                    <p className="text-text-sub italic text-sm">기록된 코멘트가 없습니다.</p>
                  )}
                </div>
              </div>

              <div className="space-y-8 mt-12 md:mt-0">
                <div className="flex items-center justify-between py-6 border-y border-border">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-text-sub uppercase tracking-widest">Date Captured</span>
                    <span className="text-sm font-bold text-text-main">{photos[selectedPhotoIndex].date}</span>
                  </div>
                  {photos[selectedPhotoIndex].locationName && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-black text-text-sub uppercase tracking-widest">Location</span>
                      <span className="text-sm font-bold text-text-main truncate max-w-[150px]">
                        {photos[selectedPhotoIndex].locationName}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/calendar?mode=timeline&date=${photos[selectedPhotoIndex].diaryDateKey}`)}
                  className="w-full group flex items-center justify-between px-8 py-5 bg-text-main text-background rounded-2xl transition-all hover:bg-main-green hover:shadow-2xl hover:shadow-main-green/20"
                >
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]">View Full Context</span>
                  <div className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center transition-transform group-hover:rotate-45">
                    <ArrowUpRight className="w-4 h-4 text-background" />
                  </div>
                </button>
              </div>
            </div>
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
