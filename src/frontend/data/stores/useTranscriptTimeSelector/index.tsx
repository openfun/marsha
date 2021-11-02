import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useTranscriptTimeSelector = create(
  subscribeWithSelector((set) => ({
    setTime: (time: number) => set({ time }),
    time: 0,
  })),
);
