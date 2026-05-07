'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const ALL_PETS_ID = 'ALL';

interface PetState {
  pets: PetProfile[];
  selectedPetId: string | typeof ALL_PETS_ID | null;
  loading: boolean;
  error: string | null;
  fetchPets: () => Promise<void>;
  setSelectedPetId: (id: string | typeof ALL_PETS_ID | null) => void;
  addPet: (data: PetFormData) => Promise<PetProfile>;
  updatePet: (id: string, data: Partial<PetFormData>) => Promise<PetProfile>;
  uploadPetPhoto: (petId: string, photo: File) => Promise<string>;
  removePet: (id: string) => Promise<void>;
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      pets: [],
      selectedPetId: ALL_PETS_ID, // 기본값을 'ALL'로 변경
      loading: false,
      error: null,

      fetchPets: async () => {
        set({ loading: true, error: null });
        try {
          const res = await clientApi.get<ApiResponse<PetProfile[]>>('/api/pets');
          const pets = res.data.data;
          set({ pets, loading: false });
          
          // 만약 선택된 펫이 'ALL'이 아니고 목록에도 없으면 'ALL'로 전환
          const currentId = get().selectedPetId;
          if (pets.length > 0 && currentId !== ALL_PETS_ID && !pets.find(p => p.id === currentId)) {
            set({ selectedPetId: ALL_PETS_ID });
          }
        } catch (err: any) {
          set({ error: err.response?.data?.message || err.message, loading: false });
        }
      },

      setSelectedPetId: (id) => set({ selectedPetId: id }),

      addPet: async (data) => {
        set({ loading: true, error: null });
        try {
          const res = await clientApi.post<ApiResponse<PetProfile>>('/api/pets', data);
          const pet = res.data.data;
          set((state) => ({ pets: [...state.pets, pet], loading: false }));
          if (!get().selectedPetId) set({ selectedPetId: pet.id });
          return pet;
        } catch (err: any) {
          set({ error: err.response?.data?.message || err.message, loading: false });
          throw err;
        }
      },

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

      uploadPetPhoto: async (petId, photo) => {
        const formData = new FormData();
        formData.append('file', photo);

        const res = await clientApi.put<ApiResponse<FileResponse>>(
          `/api/files/PET_PROFILE/${petId}/replace`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        const fileUrl = res.data.data.fileUrl;

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
          const newPets = get().pets.filter((p) => p.id !== id);
          set({ pets: newPets, loading: false });
          
          if (get().selectedPetId === id) {
            set({ selectedPetId: newPets.length > 0 ? newPets[0].id : null });
          }
        } catch (err: any) {
          set({ error: err.response?.data?.message || err.message, loading: false });
          throw err;
        }
      },
    }),
    {
      name: 'pet-storage',
      partialize: (state) => ({ selectedPetId: state.selectedPetId }),
    }
  )
);

export const usePet = () => usePetStore();
