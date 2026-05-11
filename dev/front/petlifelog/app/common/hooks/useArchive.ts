'use client';

import { useState, useEffect } from 'react';
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
  const { selectedPetId } = usePetStore();

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const validPetId = selectedPetId && selectedPetId !== ALL_PETS_ID ? selectedPetId : null;
        const petParam = validPetId ? `?petId=${validPetId}` : '';
        const res = await clientApi.get(`/api/archive/themes${petParam}`);
        const data: any[] = res.data?.data || [];
        setArchiveThemes(data.map(item => ({
          categoryName: item.tag,
          representativePhoto: getImagePath(item.representativePhotoUrl),
          photoCount: Number(item.count),
          themeEssay: '',
          photos: [],
        })));
      } catch (e) {
        console.error('테마 로딩 실패:', e);
      }
    };
    fetchThemes();
  }, [selectedPetId]);

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

  return {
    archiveThemes,
    getTheme: (categoryName: string) => archiveThemes.find(t => t.categoryName === categoryName),
    syncSearch,
    suggestTags,
    getPhotosByTag,
  };
};
