import create from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

type State = {
  time: number;
  setTime: (time: number) => void;
};

export const useTranscriptTimeSelector = create(
  subscribeWithSelector<State>((set) => ({
    setTime: (time) => set({ time }),
    time: 0,
  })),
);
