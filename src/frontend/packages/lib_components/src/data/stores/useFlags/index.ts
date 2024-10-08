import { create } from 'zustand';

import { flags } from '@lib-components/types/AppData';

interface FlagsStore {
  flags: Record<flags, boolean>;
  setFlags: (flags: Partial<Record<flags, boolean>>) => void;
  isFlagEnabled: (flag: flags) => boolean;
}

export const useFlags = create<FlagsStore>((set, get) => ({
  flags: {
    classroom: false,
    deposit: false,
    markdown: false,
    video: false,
    webinar: false,
    document: false,
    sentry: false,
    live_raw: false,
    transcription: false,
  },
  setFlags: (flags) => {
    set((state) => {
      state.flags = { ...state.flags, ...flags };
      return state;
    });
  },
  isFlagEnabled: (flag: flags) => {
    return get().flags[flag] ?? false;
  },
}));
