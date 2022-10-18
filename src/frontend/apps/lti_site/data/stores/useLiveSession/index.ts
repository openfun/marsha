import { Maybe } from 'lib-common';
import create from 'zustand';

import { LiveSession } from 'lib-components';

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
