'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'SNACK' | 'TOY' | 'CLOTHES' | 'HEALTH';
  photo: string;
  brand?: string;
  expiryDate?: string;
  recommendedAmount?: string;
  rating: number;
  addedAt: string;
}

interface InventoryState {
  items: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      items: [
        {
          id: '1',
          name: '오리안심 육포',
          category: 'SNACK',
          photo: '/dog-eat.jpg',
          brand: '펫프렌즈',
          expiryDate: '2027-05-20',
          recommendedAmount: '하루 2개 이내',
          rating: 5,
          addedAt: '2026-05-01'
        },
        {
          id: '2',
          name: '노란색 삑삑이 공',
          category: 'TOY',
          photo: '/dog-play.jpg',
          brand: '콩(KONG)',
          rating: 4,
          addedAt: '2026-04-15'
        }
      ],
      addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
      updateItem: (id, updates) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
      }))
    }),
    {
      name: 'inventory-storage'
    }
  )
);

export const useInventory = () => {
  const store = useInventoryStore();
  return {
    ...store,
    snacks: store.items.filter(i => i.category === 'SNACK'),
    toys: store.items.filter(i => i.category === 'TOY'),
    health: store.items.filter(i => i.category === 'HEALTH'),
    clothes: store.items.filter(i => i.category === 'CLOTHES'),
  };
};
