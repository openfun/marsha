import create from 'zustand';

interface State {
  time: number;
  setTime: (time: number) => void;
}

export const [useTranscriptTimeSelector, useTranscriptTimeSelectorApi] = create<
  State
>(set => ({
  setTime: time => set({ time }),
  time: 0,
}));
