import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface UseTranscriptTimeSelectorState {
  time: number;
  setTime: (time: number) => void;
}

export const useTranscriptTimeSelector =
  create<UseTranscriptTimeSelectorState>()(
    subscribeWithSelector((set) => ({
      setTime: (time: number) => set({ time }),
      time: 0,
    })),
  );
