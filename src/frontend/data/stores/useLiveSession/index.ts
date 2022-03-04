import { LiveSession } from 'types/tracks';
import { Maybe } from 'utils/types';
import create from 'zustand';

export type State = {
  liveSession: Maybe<LiveSession>;
  setLiveSession: (liveSession: LiveSession) => void;
};

export const useLiveSession = create<State>((set) => ({
  liveSession: undefined,
  setLiveSession: (liveSession: LiveSession) => {
    set({ liveSession });
  },
}));
