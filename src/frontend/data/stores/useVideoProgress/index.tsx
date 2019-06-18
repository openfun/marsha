import create from 'zustand';

export const [useVideoProgress] = create(set => ({
  playerCurrentTime: 0,
  setPlayerCurrentTime: (time: number) => set({ playerCurrentTime: time }),
}));
