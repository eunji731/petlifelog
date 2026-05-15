'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { useArchive, ArchiveTheme } from '@/app/common/hooks/useArchive';
import { usePet, ALL_PETS_ID } from '@/app/common/hooks/usePet';

export default function ArchivePage() {
  const { archiveThemes, isLoadingThemes, hasMore, loadMoreThemes, searchThemes, suggestTags } = useArchive();
  const { pets, selectedPetId } = usePet();

  const selectedPet = pets.find(p => p.id === selectedPetId);
  const petDisplayName = selectedPetId === ALL_PETS_ID ? '가족' : (selectedPet?.name || '아이');

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<ArchiveTheme[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isSearching) {
          loadMoreThemes();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreThemes, isSearching]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      const tags = await suggestTags(value);
      setSuggestions(tags);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setShowSuggestions(false);
    const results = await searchThemes(query);
    setSearchResults(results);
  };

  const handleTagClick = async (tag: string) => {
    setSearchQuery(tag);
    setIsSearching(true);
    setShowSuggestions(false);
    const results = await searchThemes(tag);
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setSuggestions([]);
  };

  // Re-trigger search when pet changes
  useEffect(() => {
    if (isSearching && searchQuery.trim()) {
      handleSearch(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPetId]);

  const top5Themes = archiveThemes.slice(0, 5);

  // Dynamic heights for masonry
  const heights = ['h-[340px]', 'h-[260px]', 'h-[300px]', 'h-[380px]', 'h-[240px]', 'h-[320px]', 'h-[280px]', 'h-[360px]'];

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-background text-text-main">
      <div className="w-full relative">
        
        {/* Full-Width Compact Sticky Header */}
        <div className="sticky top-0 z-[100] bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="w-full px-4 md:px-10 h-16 flex items-center justify-between gap-3 md:gap-12">
            {/* Minimal Title */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-main-green/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-main-green" />
              </div>
              <h1 className="text-lg font-black tracking-tight whitespace-nowrap">
                {petDisplayName}<span className="text-main-green"> 아카이브</span>
              </h1>
            </div>

            {/* Inline Quick Themes - Centered and Fluid */}
            <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center overflow-x-auto no-scrollbar">
              {top5Themes.map((theme, index) => (
                <button
                  key={`${theme.categoryName}-${index}`}
                  onClick={() => handleTagClick(theme.categoryName)}
                  className="px-4 py-1.5 text-[11px] font-bold text-text-sub hover:text-main-green hover:bg-main-green/5 rounded-full transition-all whitespace-nowrap"
                >
                  #{theme.categoryName}
                </button>
              ))}
            </nav>

            {/* Compact Integrated Search */}
            <div className="relative group shrink-0" ref={searchRef}>
              <div className="flex items-center bg-surface-green/50 rounded-full px-3 md:px-5 py-2 border border-transparent focus-within:border-main-green/30 focus-within:bg-background transition-all shadow-sm">
                <Search className="w-4 h-4 text-text-sub mr-2 group-focus-within:text-main-green shrink-0" />
                <input
                  type="text"
                  placeholder="태그 검색..."
                  className="bg-transparent border-none focus:outline-none text-[11px] font-bold text-text-main placeholder:text-text-sub/40 w-24 sm:w-36 md:w-56"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="ml-2">
                    <X className="w-3.5 h-3.5 text-text-sub hover:text-red-500" />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-background border border-border shadow-2xl rounded-2xl overflow-hidden z-[110] animate-in fade-in slide-in-from-top-1">
                  {suggestions.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className="w-full flex items-center justify-between p-4 hover:bg-surface-green transition-all text-left group"
                    >
                      <span className="text-[12px] font-bold text-text-main group-hover:text-main-green">{tag}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-text-sub group-hover:text-main-green opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section - Full-Width Responsive Grid */}
        <div className="w-full px-4 md:px-8 xl:px-12 pt-10 pb-32">
          {isSearching ? (

            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-border">
                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-black tracking-tight text-text-main italic">"{searchQuery}"</span>
                  <span className="text-[11px] font-bold text-text-sub uppercase tracking-[0.2em]">/ {searchResults.length} Archives Found</span>
                </div>
                <button onClick={clearSearch} className="text-[10px] font-black uppercase tracking-widest text-main-green hover:underline">CLOSE SEARCH</button>
              </div>

              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6 animate-in fade-in zoom-in duration-700">
                  <div className="w-20 h-20 bg-surface-green/50 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-main-green/20" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-lg font-black text-text-main">검색 결과가 없어요</p>
                    <p className="text-xs font-bold text-text-sub uppercase tracking-widest">No Archives Found for &quot;{searchQuery}&quot;</p>
                  </div>
                  <button 
                    onClick={clearSearch}
                    className="px-6 py-2.5 border border-main-green/30 text-main-green text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-main-green hover:text-white transition-all"
                  >
                    전체 보기로 돌아가기
                  </button>
                </div>
              ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6">
                  {searchResults.map((theme, index) => (
                    <Link
                      key={`${theme.categoryName}-${index}`}
                      href={`/archive/${encodeURIComponent(theme.categoryName)}`}
                      className={`group relative block overflow-hidden rounded-[24px] shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 ${
                        heights[index % heights.length]
                      }`}
                    >
                      <Image
                        src={theme.representativePhoto}
                        alt={theme.categoryName}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <div className="mb-3">
                          <span className="text-[9px] font-black text-main-yellow uppercase tracking-[0.4em] bg-black/30 backdrop-blur-md px-3 py-1 rounded-full inline-block border border-white/10">
                            EDITION {(index + 1).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase group-hover:text-main-green transition-colors drop-shadow-md leading-none">
                          {theme.categoryName}
                        </h2>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="h-[2px] w-6 bg-main-green/50 group-hover:w-10 transition-all duration-500" />
                          <span className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase">
                            {theme.photoCount} Captures
                          </span>
                        </div>
                      </div>
                      <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-700 scale-75 group-hover:scale-100">
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {archiveThemes.length === 0 && !isLoadingThemes ? (
                <div className="flex flex-col items-center justify-center py-40 gap-8 animate-in fade-in zoom-in duration-700">
                  <div className="relative">
                    <div className="w-24 h-24 bg-surface-green/50 rounded-[32px] rotate-12 absolute -inset-2" />
                    <div className="w-24 h-24 bg-background border border-border rounded-[32px] flex items-center justify-center relative shadow-sm">
                      <Sparkles className="w-10 h-10 text-main-green/20" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-text-main">아직 보관된 추억이 없어요</h3>
                    <p className="text-sm font-bold text-text-sub leading-relaxed">
                      일기를 작성하고 사진을 등록하면<br />
                      AI가 테마별로 소중한 순간들을 모아드려요.
                    </p>
                  </div>
                  <Link 
                    href="/calendar" 
                    className="px-10 py-4 bg-main-green text-white text-sm font-black rounded-2xl shadow-xl shadow-main-green/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    일기 작성하고 추억 쌓기
                  </Link>
                </div>
              ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-6 space-y-6 animate-in fade-in duration-1000">
                  {archiveThemes.map((theme, index) => (
                    <Link
                      key={`${theme.categoryName}-${index}`}
                      href={`/archive/${encodeURIComponent(theme.categoryName)}`}
                      className={`group relative block overflow-hidden rounded-[24px] shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 ${
                        heights[index % heights.length]
                      }`}
                    >
                      <Image
                        src={theme.representativePhoto}
                        alt={theme.categoryName}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

                      <div className="absolute inset-0 p-8 flex flex-col justify-end">
                        <div className="mb-3">
                          <span className="text-[9px] font-black text-main-yellow uppercase tracking-[0.4em] bg-black/30 backdrop-blur-md px-3 py-1 rounded-full inline-block border border-white/10">
                            EDITION {(index + 1).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase group-hover:text-main-green transition-colors drop-shadow-md leading-none">
                          {theme.categoryName}
                        </h2>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="h-[2px] w-6 bg-main-green/50 group-hover:w-10 transition-all duration-500" />
                          <span className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase">
                            {theme.photoCount} Captures
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-700 scale-75 group-hover:scale-100">
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-16 flex items-center justify-center mt-4">
                {isLoadingThemes && (
                  <div className="flex items-center gap-2 text-text-sub">
                    <div className="w-1.5 h-1.5 rounded-full bg-main-green animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-main-green animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-main-green animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                {!hasMore && archiveThemes.length > 0 && !isLoadingThemes && (
                  <span className="text-[10px] font-black text-text-sub uppercase tracking-widest opacity-30">— End of Archive —</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Full-Width Minimal Footer */}
        <footer className="px-10 flex justify-between items-center border-t border-border py-10 opacity-30">
          <div className="flex items-center gap-4">
            <Image src="/logo_simple.png" alt="Logo" width={20} height={20} className="grayscale" />
            <span className="text-[10px] font-black tracking-[0.5em] text-text-sub uppercase">PetLife / Unified Archive System</span>
          </div>
          <span className="text-[10px] font-black text-main-green/40">© 2026 EDITION</span>
        </footer>
      </div>
    </div>
  );
}
