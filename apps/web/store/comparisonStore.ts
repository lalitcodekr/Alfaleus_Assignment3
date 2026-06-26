import { create } from 'zustand';

interface ComparisonState {
  selectedIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  selectedIds: [],
  add: (id) => {
    if (get().selectedIds.length >= 4) return;
    if (!get().selectedIds.includes(id)) {
      set((s) => ({ selectedIds: [...s.selectedIds, id] }));
    }
  },
  remove: (id) => set((s) => ({ selectedIds: s.selectedIds.filter((i) => i !== id) })),
  clear: () => set({ selectedIds: [] }),
}));
