'use client';

import { create } from 'zustand';
import clientApi from '../lib/clientApi';

export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  birthDate: string;
  adoptionDate?: string;
  gender: 'MALE' | 'FEMALE';
  weightKg?: number;
  photo: string;
  traits: string;
  appearance?: string;
  likes?: string;
  dislikes?: string;
  diaryTone?: string;
  isActive: boolean;
  addedAt: string;
}

export type PetFormData = Omit<PetProfile, 'id' | 'addedAt' | 'photo' | 'isActive'>;

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface FileResponse {
  id: string;
  fileUrl: string;
  originalName: string;
}

interface PetState {
  pets: PetProfile[];
  loading: boolean;
  error: string | null;
  fetchPets: () => Promise<void>;
  addPet: (data: PetFormData) => Promise<PetProfile>;
  updatePet: (id: string, data: Partial<PetFormData>) => Promise<PetProfile>;
  uploadPetPhoto: (petId: string, photo: File) => Promise<string>;
  removePet: (id: string) => Promise<void>;
}

export const usePetStore = create<PetState>((set) => ({
  pets: [],
  loading: false,
  error: null,

  fetchPets: async () => {
    set({ loading: true, error: null });
    try {
      const res = await clientApi.get<ApiResponse<PetProfile[]>>('/api/pets');
      set({ pets: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  // 펫 기본 정보 등록 (사진 없이)
  addPet: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await clientApi.post<ApiResponse<PetProfile>>('/api/pets', data);
      const pet = res.data.data;
      set((state) => ({ pets: [...state.pets, pet], loading: false }));
      return pet;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  // 펫 기본 정보 수정 (사진 없이)
  updatePet: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await clientApi.put<ApiResponse<PetProfile>>(`/api/pets/${id}`, data);
      const pet = res.data.data;
      set((state) => ({
        pets: state.pets.map((p) => (p.id === id ? pet : p)),
        loading: false,
      }));
      return pet;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  // 프로필 사진 업로드/교체 → /api/files/PET_PROFILE/{petId}/replace
  uploadPetPhoto: async (petId, photo) => {
    const formData = new FormData();
    formData.append('file', photo);

    const res = await clientApi.put<ApiResponse<FileResponse>>(
      `/api/files/PET_PROFILE/${petId}/replace`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    const fileUrl = res.data.data.fileUrl;

    // 로컬 pet 목록의 photo URL 즉시 갱신
    set((state) => ({
      pets: state.pets.map((p) =>
        p.id === petId ? { ...p, photo: fileUrl } : p
      ),
    }));

    return fileUrl;
  },

  removePet: async (id) => {
    set({ loading: true, error: null });
    try {
      await clientApi.delete(`/api/pets/${id}`);
      set((state) => ({
        pets: state.pets.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },
}));

export const usePet = () => usePetStore();
