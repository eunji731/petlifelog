'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePetStore, ALL_PETS_ID } from './usePet';
import clientApi, { getImagePath } from '@/app/common/lib/clientApi';

export interface ArchivePhoto {
  id: string;
  path: string;
  isBest: boolean;
  photoComment: string;
  vibeScore: number;
  locationName: string;
  date: string;
  diaryDateKey: string;
}

export interface ArchiveTheme {
  categoryName: string;
  representativePhoto: string;
  photoCount: number;
  themeEssay: string;
  photos: ArchivePhoto[];
}

const PAGE_SIZE = 10;

function mapPhoto(raw: any): ArchivePhoto {
  const date = raw.memoryDate ? String(raw.memoryDate).replaceAll('-', '.') : '';
  return {
    id: raw.photoId || '',
    path: getImagePath(raw.photoUrl),
    isBest: raw.isBest ?? false,
    photoComment: raw.aiComment || '',
    vibeScore: raw.vibeScore ?? 0,
    locationName: '',
    date,
    diaryDateKey: raw.memoryDate || '',
  };
}

export const useArchive = () => {
  const [archiveThemes, setArchiveThemes] = useState<ArchiveTheme[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const { selectedPetId } = usePetStore();
  const prevPetId = useRef(selectedPetId);

  const fetchThemePage = useCallback(async (pageNum: number, petId: string | null) => {
    setIsLoadingThemes(true);
    try {
      const petParam = petId ? `&petId=${petId}` : '';
      const res = await clientApi.get(`/api/archive/themes?page=${pageNum}&size=${PAGE_SIZE}${petParam}`);
      const data: any[] = res.data?.data || [];
      const mapped: ArchiveTheme[] = data.map(item => ({
        categoryName: item.tag,
        representativePhoto: getImagePath(item.representativePhotoUrl),
        photoCount: Number(item.count),
        themeEssay: '',
        photos: [],
      }));
      setArchiveThemes(prev => {
        const next = pageNum === 0 ? mapped : [...prev, ...mapped];
        return next.filter((theme, idx, self) => 
          idx === self.findIndex((t) => t.categoryName === theme.categoryName)
        );
      });
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      console.error('테마 로딩 실패:', e);
    } finally {
      setIsLoadingThemes(false);
    }
  }, []);

  useEffect(() => {
    const validPetId = selectedPetId && selectedPetId !== ALL_PETS_ID ? selectedPetId : null;

    if (prevPetId.current !== selectedPetId) {
      prevPetId.current = selectedPetId;
      setPage(0);
      setHasMore(true);
      fetchThemePage(0, validPetId);
    } else {
      fetchThemePage(0, validPetId);
    }
  }, [selectedPetId, fetchThemePage]);

  const loadMoreThemes = useCallback(() => {
    if (isLoadingThemes || !hasMore) return;
    const validPetId = selectedPetId && selectedPetId !== ALL_PETS_ID ? selectedPetId : null;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchThemePage(nextPage, validPetId);
  }, [isLoadingThemes, hasMore, selectedPetId, page, fetchThemePage]);

  const validPetId = selectedPetId && selectedPetId !== ALL_PETS_ID ? selectedPetId : null;

  const syncSearch = async (query: string) => {
    try {
      const petParam = validPetId ? `&petId=${validPetId}` : '';
      const res = await clientApi.get(`/api/archive/search?q=${encodeURIComponent(query)}${petParam}`);
      return (res.data?.data || []).map(mapPhoto);
    } catch (e) {
      console.error('검색 실패:', e);
      return [];
    }
  };

  const searchThemes = async (query: string): Promise<ArchiveTheme[]> => {
    try {
      const petParam = validPetId ? `&petId=${validPetId}` : '';
      const res = await clientApi.get(`/api/archive/themes/search?q=${encodeURIComponent(query)}${petParam}`);
      const data: any[] = res.data?.data || [];
      return data.map(item => ({
        categoryName: item.tag,
        representativePhoto: getImagePath(item.representativePhotoUrl),
        photoCount: Number(item.count),
        themeEssay: '',
        photos: [],
      }));
    } catch (e) {
      console.error('테마 검색 실패:', e);
      return [];
    }
  };

  const suggestTags = async (query: string) => {
    try {
      const petParam = validPetId ? `&petId=${validPetId}` : '';
      const res = await clientApi.get(`/api/archive/tags/suggest?q=${encodeURIComponent(query)}${petParam}`);
      return res.data?.data || [];
    } catch (e) {
      console.error('태그 추천 실패:', e);
      return [];
    }
  };

  const getPhotosByTag = async (tag: string) => {
    try {
      const petParam = validPetId ? `&petId=${validPetId}` : '';
      const res = await clientApi.get(`/api/archive/photos?tag=${encodeURIComponent(tag)}${petParam}`);
      return (res.data?.data || []).map(mapPhoto);
    } catch (e) {
      console.error('태그 검색 실패:', e);
      return [];
    }
  };

  const fetchThemeDetail = async (tag: string): Promise<ArchiveTheme | null> => {
    try {
      const petParam = validPetId ? `?petId=${validPetId}` : '';
      const res = await clientApi.get(`/api/archive/themes/${encodeURIComponent(tag)}${petParam}`);
      const item = res.data?.data;
      if (!item) return null;
      
      return {
        categoryName: item.tag,
        representativePhoto: getImagePath(item.representativePhotoUrl),
        photoCount: Number(item.count),
        themeEssay: '',
        photos: [],
      };
    } catch (e) {
      console.error('테마 상세 로딩 실패:', e);
      return null;
    }
  };

  return {
    archiveThemes,
    isLoadingThemes,
    hasMore,
    loadMoreThemes,
    getTheme: (categoryName: string) => archiveThemes.find(t => t.categoryName === categoryName),
    fetchThemeDetail,
    syncSearch,
    searchThemes,
    suggestTags,
    getPhotosByTag,
  };
};
