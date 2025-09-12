'use client';

import { create } from 'zustand';
import type { CellKey } from '../lib/types';

// Define the shape of the project state
type ProjectState = {
  active: Set<CellKey>; // Active cells - notes toggled on the grid
  toggleCell: (row: number, col: number) => void; // Toggle cell state
  clearAll: () => void; // Clear all active cells
}

// Zustand store for project state
export const useProjectStore = create<ProjectState>((set) => ({
  active: new Set(),

  toggleCell: (row, col) =>
    set((state) => {
      const next = new Set(state.active);
      const key = `${row}:${col}` as CellKey;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { active: next };
    }),

  clearAll: () => set({ active: new Set() }),
}));
