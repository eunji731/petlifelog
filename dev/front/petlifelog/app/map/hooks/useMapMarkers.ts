'use client';

import { useState, useCallback, useRef } from 'react';
import clientApi from '@/app/common/lib/clientApi';
import { usePetStore, ALL_PETS_ID } from '@/app/common/hooks/usePet';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  thumb: string;
  momentId: string;
  dateKey: string;
}

export interface MapMemoryDetail {
  photoId: string;
  path: string;
  takenAt?: string;
  latitude: number;
  longitude: number;
  moment: {
    id: string;
    aiTitle?: string;
    category?: string;
    locationName?: string;
    aiDiary?: string;
  };
  dailyLog: {
    id: string;
    dateKey: string;
    aiTitle?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface BBox {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

const DEBOUNCE_MS = 300;

export function useMapMarkers() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const { selectedPetId } = usePetStore();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMarkers = useCallback((bbox: BBox, zoom?: number) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          swLat: bbox.swLat,
          swLng: bbox.swLng,
          neLat: bbox.neLat,
          neLng: bbox.neLng,
        };
        if (zoom !== undefined) params.zoom = zoom;
        if (selectedPetId && selectedPetId !== ALL_PETS_ID) {
          params.petId = selectedPetId;
        }
        const res = await clientApi.get<ApiResponse<MapMarker[]>>('/api/map/markers', { params });
        setMarkers(res.data.data ?? []);
      } catch {
        // 네트워크 오류 시 기존 마커 유지
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, [selectedPetId]);

  const searchMarkers = useCallback(async (keyword: string): Promise<MapMemoryDetail[]> => {
    setLoading(true);
    try {
      const params: Record<string, string> = { keyword };
      if (selectedPetId && selectedPetId !== ALL_PETS_ID) {
        params.petId = selectedPetId;
      }
      
      // 1. 검색 결과 리스트 (상세 정보 포함) 가져오기
      const res = await clientApi.get<ApiResponse<MapMemoryDetail[]>>('/api/map/search', { params });
      const results = res.data.data ?? [];
      
      // 2. 검색 결과에 맞춰 지도 마커 업데이트
      const searchMarkers: MapMarker[] = results.map(r => ({
        id: r.moment.id,
        lat: r.latitude,
        lng: r.longitude,
        thumb: r.path,
        momentId: r.moment.id,
        dateKey: r.dailyLog.dateKey
      }));
      setMarkers(searchMarkers);
      
      return results;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedPetId]);

  const fetchSuggestions = useCallback(async (q?: string): Promise<string[]> => {
    try {
      const params: Record<string, string> = {};
      if (q) params.q = q;
      const res = await clientApi.get<ApiResponse<string[]>>('/api/map/search/suggestions', { params });
      return res.data.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const fetchDetail = useCallback(async (memoryId: string): Promise<MapMemoryDetail | null> => {
    setDetailLoading(true);
    try {
      const res = await clientApi.get<ApiResponse<MapMemoryDetail>>(`/api/map/memories/${memoryId}`);
      return res.data.data;
    } catch {
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return { markers, loading, detailLoading, fetchMarkers, fetchDetail, searchMarkers, fetchSuggestions };
}
