'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Navigation, Layers, ZoomIn, ZoomOut, Calendar, Sparkles, X, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import NaverMap from '@/app/map/components/NaverMap';
import { useMapMemories, MapMemory } from '@/app/map/hooks/useMapMemories';
import { getImagePath } from '@/app/common/lib/clientApi';

export default function MapPage() {
  const { memories, loading } = useMapMemories();
  const [selectedMemory, setSelectedMemory] = useState<MapMemory | null>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);

  const handleMapLoad = (map: naver.maps.Map) => {
    mapInstanceRef.current = map;
    updateMarkers(map, memories);
  };

  const updateMarkers = (map: naver.maps.Map, data: MapMemory[]) => {
    if (!window.naver) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    data.forEach((memory) => {
      const photoUrl = getImagePath(memory.path);

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(memory.latitude, memory.longitude),
        map,
        title: memory.moment.locationName || '추억의 장소',
        icon: {
          content: `
            <div class="relative group cursor-pointer">
              <div class="text-main-yellow drop-shadow-lg transition-transform group-hover:scale-110">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3" fill="white"></circle>
                </svg>
              </div>
              <div class="absolute top-1 left-1 w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm ring-2 ring-main-yellow/20">
                <img src="${photoUrl}" alt="Pet" class="w-full h-full object-cover" />
              </div>
            </div>
          `,
          anchor: new naver.maps.Point(22, 44),
        },
      });

      naver.maps.Event.addListener(marker, 'click', () => {
        setSelectedMemory(memory);
      });

      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      const firstPos = markersRef.current[0].getPosition() as naver.maps.LatLng;
      const bounds = new naver.maps.LatLngBounds(firstPos, firstPos);
      markersRef.current.forEach(marker => bounds.extend(marker.getPosition() as naver.maps.LatLng));
      map.panToBounds(bounds);
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers(mapInstanceRef.current, memories);
    }
  }, [memories]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() ?? 15) + 1);
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() ?? 15) - 1);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        const latLng = new naver.maps.LatLng(coords.latitude, coords.longitude);
        mapInstanceRef.current?.setCenter(latLng);
        mapInstanceRef.current?.setZoom(16);
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <NaverMap onMapLoad={handleMapLoad} />
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-10 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg text-sm font-bold text-text-sub">
            <MapPin className="w-4 h-4 animate-bounce text-main-green" />
            추억 불러오는 중...
          </div>
        </div>
      )}

      {/* Floating Controls */}
      <div className="absolute top-6 left-6 right-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
          <input
            type="text"
            placeholder="장소나 추억을 검색해 보세요..."
            className="w-full pl-11 pr-4 py-4 bg-white/90 backdrop-blur-md border border-white rounded-[24px] shadow-2xl shadow-main-green/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main-green/20 transition-all"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCurrentLocation}
            className="p-4 bg-white/90 backdrop-blur-md border border-white rounded-2xl shadow-xl text-text-main hover:bg-main-green hover:text-white transition-all"
          >
            <Navigation className="w-5 h-5" />
          </button>
          <button className="p-4 bg-white/90 backdrop-blur-md border border-white rounded-2xl shadow-xl text-text-main hover:bg-main-green hover:text-white transition-all">
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-3 bg-white border border-border rounded-xl shadow-lg text-text-main hover:bg-surface-green transition-all"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-3 bg-white border border-border rounded-xl shadow-lg text-text-main hover:bg-surface-green transition-all"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Selected Memory Detail Overlay */}
      {selectedMemory && (
        <div className="absolute bottom-8 left-6 right-6 md:left-auto md:right-8 md:w-[400px] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl border border-border ring-1 ring-black/5">
            <div className="relative h-48">
              <Image
                src={getImagePath(selectedMemory.path)}
                alt="Location"
                fill
                className="object-cover"
              />
              <button
                onClick={() => setSelectedMemory(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4 flex gap-1.5">
                {selectedMemory.moment.category && (
                  <span className="px-2.5 py-1 bg-main-green text-white text-[9px] font-black rounded-full shadow-lg uppercase tracking-widest">
                    {selectedMemory.moment.category}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-text-main text-[9px] font-black rounded-full shadow-lg">
                  {selectedMemory.dailyLog.dateKey}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-text-main tracking-tight">
                  {selectedMemory.moment.locationName || '추억의 장소'}
                </h3>
                <p className="text-sm font-bold text-text-sub flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-main-yellow fill-main-yellow" />
                  {selectedMemory.moment.aiTitle || selectedMemory.dailyLog.aiTitle}
                </p>
              </div>

              {selectedMemory.moment.aiDiary && (
                <div className="bg-surface-green/50 p-4 rounded-2xl border border-main-green/5 italic text-sm font-medium text-text-main/80 leading-relaxed line-clamp-3">
                  &quot;{selectedMemory.moment.aiDiary}&quot;
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/calendar?date=${selectedMemory.dailyLog.dateKey}`}
                  className="flex-1 py-3.5 bg-main-green text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-main-green/20"
                >
                  <Calendar className="w-3.5 h-3.5" /> 전체 일기 보기
                </Link>
                <button className="w-14 py-3.5 bg-surface-green text-text-main rounded-xl flex items-center justify-center hover:bg-border transition-all">
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
