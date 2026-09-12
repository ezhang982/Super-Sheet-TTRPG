import { create } from "zustand";

export interface RevertToast {
  id: string;
  message: string;
  onRevert: () => void;
}

interface RevertToastStore {
  toast: RevertToast | null;
  showToast: (message: string, onRevert: () => void) => void;
  dismissToast: () => void;
}

export const useRevertToast = create<RevertToastStore>((set) => ({
  toast: null,
  showToast: (message: string, onRevert: () => void) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set({
      toast: {
        id,
        message,
        onRevert,
      },
    });
  },
  dismissToast: () => {
    set({ toast: null });
  },
}));
