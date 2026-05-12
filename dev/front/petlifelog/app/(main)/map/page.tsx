'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Search, Navigation, ZoomIn, ZoomOut, Calendar, Sparkles, X, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import NaverMap from '@/app/map/components/NaverMap';
import MomentImageSlider from '@/app/calendar/components/MomentImageSlider';
import { useMapMarkers, MapMemoryDetail, BBox } from '@/app/map/hooks/useMapMarkers';
import { getImagePath } from '@/app/common/lib/clientApi';

const WORLD_BBOX: BBox = { swLat: -90, swLng: -180, neLat: 90, neLng: 180 };

/** markers 배열에서 모두 보이는 center / zoom 계산 */
function calcFit(markers: naver.maps.Marker[]): { center: naver.maps.LatLng; zoom: number } | null {
  if (markers.length === 0) return null;
  const firstPos = markers[0].getPosition() as naver.maps.LatLng;
  const bounds = new naver.maps.LatLngBounds(firstPos, firstPos);
  markers.forEach(m => bounds.extend(m.getPosition() as naver.maps.LatLng));
  const sw = bounds.getSW() as naver.maps.LatLng;
  const ne = bounds.getNE() as naver.maps.LatLng;
  const latSpan = Math.max(ne.lat() - sw.lat(), 0.005);
  const lngSpan = Math.max(ne.lng() - sw.lng(), 0.005);
  // 코사인 보정으로 경도 스팬 축소 후 가장 큰 쪽 기준 줌 계산
  const center = bounds.getCenter() as naver.maps.LatLng;
  const cosLat = Math.cos((center.lat() * Math.PI) / 180);
  const maxSpan = Math.max(latSpan, lngSpan * cosLat);
  const zoom = Math.min(14, Math.max(7, Math.floor(Math.log2(90 / maxSpan))));
  return { center, zoom };
}

export default function MapPage() {
  const { markers, loading, detailLoading, fetchMarkers, fetchDetail, searchMarkers } = useMapMarkers();
  const [selectedDetail, setSelectedDetail] = useState<MapMemoryDetail | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapMemoryDetail[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const lastBboxRef = useRef<BBox>(WORLD_BBOX);
  const isFirstLoad = useRef(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 클릭 외부 감지 (검색창 닫기)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // markers에서 momentId별로 그룹화하여 하나씩만 표시
  const groupedMarkers = useMemo(() => {
    const momentMap = new Map<string, typeof markers[0]>();
    markers.forEach(m => {
      if (!momentMap.has(m.momentId)) {
        momentMap.set(m.momentId, m);
      }
    });
    return Array.from(momentMap.values());
  }, [markers]);

  // 선택된 모멘트의 모든 사진 추출
  const photosForSelectedMoment = useMemo(() => {
    if (!selectedDetail) return [];
    const photos = markers
      .filter(m => m.momentId === selectedDetail.moment.id)
      .map(m => ({ id: m.id, path: m.thumb }));
    
    // 만약 현재 markers에 정보가 부족하면(검색 결과 등) 현재 상세 정보의 사진이라도 넣음
    if (photos.length === 0) {
      return [{ id: selectedDetail.photoId, path: selectedDetail.path }];
    }
    return photos;
  }, [selectedDetail, markers]);

  // 지도 초기화 → 전체 범위 조회 (지도는 아직 안 보임)
  const handleMapLoad = useCallback((map: naver.maps.Map) => {
    mapInstanceRef.current = map;
    fetchMarkers(WORLD_BBOX);
  }, [fetchMarkers]);

  // pan / zoom 시 현재 뷰포트 범위 재조회
  const handleBoundsChanged = useCallback((bounds: naver.maps.LatLngBounds) => {
    const sw = bounds.getSW() as naver.maps.LatLng;
    const ne = bounds.getNE() as naver.maps.LatLng;
    const bbox: BBox = { swLat: sw.lat(), swLng: sw.lng(), neLat: ne.lat(), neLng: ne.lng() };
    lastBboxRef.current = bbox;
    
    // 검색 중이 아닐 때만 범위 기반 조회
    if (!searchQuery) {
      fetchMarkers(bbox, mapInstanceRef.current?.getZoom());
    }
  }, [fetchMarkers, searchQuery]);

  // 펫 변경(fetchMarkers 재생성) 시 현재 뷰포트 기준 재조회
  useEffect(() => {
    if (isFirstLoad.current) return; // 최초 로드는 handleMapLoad 에서 담당
    if (mapInstanceRef.current && !searchQuery) {
      fetchMarkers(lastBboxRef.current);
    }
  }, [fetchMarkers, searchQuery]);

  // markers 변경 → 지도 핀 갱신
  const updateMarkers = useCallback((map: naver.maps.Map) => {
    if (!window.naver) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    groupedMarkers.forEach((marker) => {
      const thumbUrl = getImagePath(marker.thumb);
      const naverMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(marker.lat, marker.lng),
        map,
        title: marker.dateKey,
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
                <img src="${thumbUrl}" alt="" class="w-full h-full object-cover" />
              </div>
            </div>
          `,
          anchor: new naver.maps.Point(22, 44),
        },
      });

      naver.maps.Event.addListener(naverMarker, 'click', async () => {
        const detail = await fetchDetail(marker.momentId);
        if (detail) setSelectedDetail(detail);
      });

      markersRef.current.push(naverMarker);
    });

    // 최초 로드 시: 모든 마커가 보이도록 즉시(애니메이션 없이) 위치 설정
    if (isFirstLoad.current && groupedMarkers.length > 0) {
      isFirstLoad.current = false;
      const fit = calcFit(markersRef.current);
      if (fit) {
        map.setCenter(fit.center);
        map.setZoom(fit.zoom);
      }
      setMapVisible(true); // 위치 잡은 뒤 지도 표시
    } else if (isFirstLoad.current && !loading) {
      // 마커가 없어도 로딩 끝났으면 지도 표시 (기본 위치)
      isFirstLoad.current = false;
      setMapVisible(true);
    }
  }, [groupedMarkers, fetchDetail, loading]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers(mapInstanceRef.current);
    }
  }, [groupedMarkers, updateMarkers]);

  // 검색 로직
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      fetchMarkers(lastBboxRef.current);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      const results = await searchMarkers(query);
      setSearchResults(results);
      
      // 검색 결과가 있으면 해당 마커들이 다 보이도록 지도 이동
      if (results.length > 0 && mapInstanceRef.current) {
        const tempMarkers = results.map(r => new naver.maps.Marker({
          position: new naver.maps.LatLng(r.latitude, r.longitude)
        }));
        const fit = calcFit(tempMarkers);
        if (fit) {
          mapInstanceRef.current.morph(fit.center, fit.zoom);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [fetchMarkers, searchMarkers]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, handleSearch]);

  const handleResultClick = (result: MapMemoryDetail) => {
    if (mapInstanceRef.current) {
      const pos = new naver.maps.LatLng(result.latitude, result.longitude);
      mapInstanceRef.current.setCenter(pos);
      mapInstanceRef.current.setZoom(16);
      setSelectedDetail(result);
      setShowResults(false);
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() ?? 13) + 1);
  const handleZoomOut = () => mapInstanceRef.current?.setZoom((mapInstanceRef.current.getZoom() ?? 13) - 1);
  const handleCurrentLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(({ coords }) => {
        mapInstanceRef.current?.setCenter(new naver.maps.LatLng(coords.latitude, coords.longitude));
        mapInstanceRef.current?.setZoom(16);
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative overflow-hidden">
      {/* 지도 - 첫 마커 위치 계산 전까지 숨김 */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${mapVisible ? 'opacity-100' : 'opacity-0'}`}>
        <NaverMap onMapLoad={handleMapLoad} onBoundsChanged={handleBoundsChanged} />
      </div>

      {/* 초기 로딩 */}
      {!mapVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full shadow-lg text-sm font-bold text-text-sub">
            <MapPin className="w-4 h-4 animate-bounce text-main-green" />
            추억 찾는 중...
          </div>
        </div>
      )}

      {/* 뷰포트 재조회 중 인디케이터 */}
      {mapVisible && loading && !isSearching && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-full shadow text-xs font-bold text-text-sub">
            <MapPin className="w-3 h-3 animate-bounce text-main-green" />
            업데이트 중
          </div>
        </div>
      )}

      {/* 상단 검색/컨트롤 */}
      <div className="absolute top-6 left-6 right-6 flex flex-col md:flex-row gap-4 items-start">
        <div ref={searchRef} className="relative flex-1 max-w-md w-full">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              placeholder="장소나 추억을 검색해 보세요..."
              className="w-full pl-11 pr-12 py-4 bg-background/90 backdrop-blur-md border border-border rounded-[24px] shadow-2xl shadow-main-green/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main-green/20 transition-all text-text-main"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setShowResults(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-green rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-text-sub" />
              </button>
            )}
          </div>

          {/* 검색 결과 리스트 - 내용이 있을 때만 표시 */}
          {showResults && (isSearching || searchQuery) && (
            <div className="absolute top-full mt-3 w-full bg-background/95 backdrop-blur-lg rounded-[24px] shadow-2xl border border-border overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {isSearching ? (
                  <div className="p-8 text-center text-text-sub text-sm font-bold">
                    <Sparkles className="w-5 h-5 animate-pulse text-main-yellow mx-auto mb-2" />
                    추억 속을 검색하고 있어요...
                  </div>
                ) : (
                  <div className="py-2">
                    {/* 사진 검색 결과 */}
                    {searchResults.length > 0 ? (
                      <div className="p-2">
                        <p className="px-4 py-2 text-[10px] font-black text-main-green uppercase tracking-widest">추억 사진 {searchResults.length}건</p>
                        {searchResults.map((result) => (
                          <button
                            key={result.moment.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center gap-4 p-3 hover:bg-surface-green rounded-2xl transition-all text-left group"
                          >
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm ring-1 ring-black/5">
                              <Image src={getImagePath(result.path)} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-text-main truncate">{result.moment.locationName || '추억의 장소'}</h4>
                              <p className="text-[11px] font-medium text-text-sub truncate">
                                {result.dailyLog.dateKey} · {result.moment.aiTitle || result.dailyLog.aiTitle}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery && !isSearching && (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-surface-green rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-6 h-6 text-main-green/30" />
                        </div>
                        <p className="text-sm font-bold text-text-main">검색 결과가 없어요</p>
                        <p className="text-xs font-medium text-text-sub mt-1">다른 키워드로 검색해 보세요.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleCurrentLocation} className="p-4 bg-background/90 backdrop-blur-md border border-border rounded-2xl shadow-xl text-text-main hover:bg-main-green hover:text-white transition-all">
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        <button onClick={handleZoomIn} className="p-3 bg-background border border-border rounded-xl shadow-lg text-text-main hover:bg-surface-green transition-all"><ZoomIn className="w-5 h-5" /></button>
        <button onClick={handleZoomOut} className="p-3 bg-background border border-border rounded-xl shadow-lg text-text-main hover:bg-surface-green transition-all"><ZoomOut className="w-5 h-5" /></button>
      </div>

      {/* 마커 클릭 상세 패널 */}
      {selectedDetail && (
        <div className="absolute bottom-8 left-6 right-6 md:left-auto md:right-8 md:w-[400px] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-background rounded-[32px] overflow-hidden shadow-2xl border border-border ring-1 ring-black/5">
            {detailLoading ? (
              <div className="h-48 flex items-center justify-center text-text-sub text-sm font-bold">
                <MapPin className="w-5 h-5 animate-bounce text-main-green mr-2" />불러오는 중...
              </div>
            ) : (
              <>
                <div className="relative h-48">
                  <MomentImageSlider photos={photosForSelectedMoment} alt={selectedDetail.moment.aiTitle || '추억 사진'} />
                  <button onClick={() => setSelectedDetail(null)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-20">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-4 left-4 flex gap-1.5 z-10">
                    {selectedDetail.moment.category && (
                      <span className="px-2.5 py-1 bg-main-green text-white text-[9px] font-black rounded-full shadow-lg uppercase tracking-widest">{selectedDetail.moment.category}</span>
                    )}
                    <span className="px-2.5 py-1 bg-background/90 backdrop-blur-sm text-text-main text-[9px] font-black rounded-full shadow-lg">{selectedDetail.dailyLog.dateKey}</span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-text-main tracking-tight">{selectedDetail.moment.locationName || '추억의 장소'}</h3>
                    <p className="text-sm font-bold text-text-sub flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-main-yellow fill-main-yellow" />
                      {selectedDetail.moment.aiTitle || selectedDetail.dailyLog.aiTitle}
                    </p>
                  </div>
                  {selectedDetail.moment.aiDiary && (
                    <div className="bg-surface-green/50 p-4 rounded-2xl border border-main-green/5 italic text-sm font-medium text-text-main/80 leading-relaxed max-h-[120px] overflow-y-auto no-scrollbar">
                      &quot;{selectedDetail.moment.aiDiary}&quot;
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link href={`/calendar?date=${selectedDetail.dailyLog.dateKey}`} className="flex-1 py-3.5 bg-main-green text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-main-green/20">
                      <Calendar className="w-3.5 h-3.5" /> 전체 일기 보기
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
