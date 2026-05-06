'use client';

import { create } from 'zustand';
import clientApi from '../lib/clientApi';

export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  birthDate: string; // YYYY-MM-DD
  adoptionDate?: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE';
  weightKg?: number;
  photo: string;
  traits: string; // Used for AI personalization
  appearance?: string;
  likes?: string;
  dislikes?: string;
  diaryTone?: string;
  isActive: boolean;
  addedAt: string;
}

interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

interface PetState {
  pets: PetProfile[];
  loading: boolean;
  error: string | null;
  fetchPets: () => Promise<void>;
  addPet: (pet: Omit<PetProfile, 'id' | 'addedAt'>) => Promise<void>;
  updatePet: (id: string, updates: Partial<PetProfile>) => Promise<void>;
  removePet: (id: string) => Promise<void>;
}

export const usePetStore = create<PetState>((set, get) => ({
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

  addPet: async (pet) => {
    set({ loading: true, error: null });
    try {
      const res = await clientApi.post<ApiResponse<PetProfile>>('/api/pets', pet);
      set((state) => ({ 
        pets: [...state.pets, res.data.data],
        loading: false 
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  updatePet: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const res = await clientApi.put<ApiResponse<PetProfile>>(`/api/pets/${id}`, updates);
      set((state) => ({
        pets: state.pets.map((p) => (p.id === id ? res.data.data : p)),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
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

export const usePet = () => {
  const store = usePetStore();
  return {
    ...store
  };
};
