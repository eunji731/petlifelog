'use client';

import { create } from 'zustand';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

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
      const res = await fetch(`${BACKEND_URL}/api/pets`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch pets');
      const result: ApiResponse<PetProfile[]> = await res.json();
      set({ pets: result.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  addPet: async (pet) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/pets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pet),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add pet');
      const result: ApiResponse<PetProfile> = await res.json();
      set((state) => ({ 
        pets: [...state.pets, result.data],
        loading: false 
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updatePet: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/pets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update pet');
      const result: ApiResponse<PetProfile> = await res.json();
      set((state) => ({
        pets: state.pets.map((p) => (p.id === id ? result.data : p)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  removePet: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BACKEND_URL}/api/pets/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete pet');
      set((state) => ({
        pets: state.pets.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
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
