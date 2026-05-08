'use client';

import { create } from 'zustand';
import clientApi from '../lib/clientApi';

export interface InventoryItem {
  id: string | number;
  name: string;
  category: 'FOOD' | 'SNACK' | 'TOY' | 'HEALTH' | 'CLOTHES' | 'ETC';
  photo: string;
  photos?: { id: string; url: string }[];
  brand?: string;

  // Dates
  productionDate?: string;
  expiryDateText?: string;
  expiryDateSpecific?: string;
  openedAt?: string;

  // Category Specific
  flavor?: string;
  ingredients?: string[];
  material?: string;
  size?: string;
  storageMethod?: 'ROOM_TEMP' | 'REFRIGERATED' | 'FROZEN';
  suggestedUsage?: string;

  // Management
  rating: number;
  stock: number;
  price?: number;
  isFeeding: boolean;
  addedAt: string;
}

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (item: InventoryItem) => void;
  updateItem: (item: InventoryItem) => void;
  removeItem: (id: string | number) => Promise<void>;
  toggleFeeding: (id: string | number) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const res = await clientApi.get('/api/inventory');
      set({ items: res.data?.data ?? [], loading: false });
    } catch (err: any) {
      console.error('인벤토리 조회 실패', err);
      set({ error: err.message, loading: false });
    }
  },

  addItem: (item) => {
    set((state) => ({ items: [item, ...state.items] }));
  },

  updateItem: (item) => {
    set((state) => ({
      items: state.items.map((i) => (String(i.id) === String(item.id) ? item : i)),
    }));
  },

  removeItem: async (id) => {
    try {
      await clientApi.delete(`/api/inventory/${id}`);
      set((state) => ({ items: state.items.filter((i) => String(i.id) !== String(id)) }));
    } catch (err) {
      console.error('아이템 삭제 실패', err);
      throw err;
    }
  },

  toggleFeeding: async (id) => {
    try {
      const res = await clientApi.patch(`/api/inventory/${id}/feeding`);
      const updated: InventoryItem = res.data?.data;
      set((state) => ({
        items: state.items.map((i) => (String(i.id) === String(id) ? { ...i, isFeeding: updated.isFeeding } : i)),
      }));
    } catch (err) {
      console.error('지급 상태 변경 실패', err);
      throw err;
    }
  },
}));

export const useInventory = () => {
  const store = useInventoryStore();
  
  // Helper filters
  const snacks = store.items.filter(i => i.category === 'SNACK');
  const toys = store.items.filter(i => i.category === 'TOY');
  const health = store.items.filter(i => i.category === 'HEALTH');
  const clothes = store.items.filter(i => i.category === 'CLOTHES');

  return {
    ...store,
    snacks,
    toys,
    health,
    clothes,
  };
};
