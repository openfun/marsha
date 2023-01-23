import { create } from 'zustand';

type State = {
  isStarted: boolean;
  setIsStarted: (started: boolean) => void;
};

export const useLiveStateStarted = create<State>((set) => ({
  isStarted: false,
  setIsStarted: (started: boolean) => {
    set(() => ({
      isStarted: started,
    }));
  },
}));
