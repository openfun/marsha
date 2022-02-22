import { LiveRegistration } from 'types/tracks';
import { Maybe } from 'utils/types';
import create from 'zustand';

export type State = {
  liveRegistration: Maybe<LiveRegistration>;
  setLiveRegistration: (liveRegistration: LiveRegistration) => void;
};

export const useLiveRegistration = create<State>((set) => ({
  liveRegistration: undefined,
  setLiveRegistration: (liveRegistration: LiveRegistration) => {
    set({ liveRegistration });
  },
}));
