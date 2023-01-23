import { create } from 'zustand';

interface SentryStore {
  isSentryReady: boolean;
  setIsSentryReady: (config: boolean) => void;
}

export const useSentry = create<SentryStore>((set) => ({
  isSentryReady: false,
  setIsSentryReady: (config: boolean) =>
    set((state) => ({ ...state, isSentryReady: config })),
}));
