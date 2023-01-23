import { Maybe } from 'lib-common';
import { LiveSession } from 'lib-components';
import { create } from 'zustand';

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
