import { create } from 'zustand';
import type { RemoteCursor } from '@/types';

interface AppState {
  cursors: Map<string, RemoteCursor>;
  upsertCursor: (cursor: RemoteCursor) => void;
  removeCursor: (userId: string) => void;
  clearCursors: () => void;
}

export const useStore = create<AppState>((set) => ({
  cursors: new Map(),

  upsertCursor: (cursor) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.set(cursor.userId, cursor);
      return { cursors: next };
    }),

  removeCursor: (userId) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.delete(userId);
      return { cursors: next };
    }),

  clearCursors: () => set({ cursors: new Map() }),
}));
