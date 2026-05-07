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

  return { markers, loading, detailLoading, fetchMarkers, fetchDetail };
}
