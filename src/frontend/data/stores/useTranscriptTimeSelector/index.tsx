import create from 'zustand';

type State = {
  time: number;
  setTime: (time: number) => void;
};

export const useTranscriptTimeSelector = create<State>((set) => ({
  setTime: (time) => set({ time }),
  time: 0,
}));
