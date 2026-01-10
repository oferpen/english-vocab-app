import { create } from 'zustand';

interface AppState {
  activeChildId: string | null;
  setActiveChildId: (id: string | null) => void;
  parentPINVerified: boolean;
  setParentPINVerified: (verified: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  activeChildId: null,
  setActiveChildId: (id) => set({ activeChildId: id }),
  parentPINVerified: false,
  setParentPINVerified: (verified) => set({ parentPINVerified: verified }),
}));
