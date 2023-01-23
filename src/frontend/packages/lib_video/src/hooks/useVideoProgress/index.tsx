import { create } from 'zustand';

type State = {
  playerCurrentTime: number;
  setPlayerCurrentTime: (newTime: number) => void;
};

export const useVideoProgress = create<State>((set) => ({
  playerCurrentTime: 0,
  setPlayerCurrentTime: (time) => set({ playerCurrentTime: time }),
}));
