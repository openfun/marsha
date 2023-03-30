import { create } from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from '@lib-components/data/stores/actions';
import { modelName } from '@lib-components/types/models';
import { StoreState } from '@lib-components/types/stores';
import { TimedText } from '@lib-components/types/tracks';

type TimedTextTrackStore = {
  [modelName.TIMEDTEXTTRACKS]: {
    [id: string]: TimedText;
  };
};

export type TimedTextTrackState = StoreState<TimedText> &
  TimedTextTrackStore & {
    getTimedTextTracks: () => TimedText[];
    reset: () => void;
  };

export const useTimedTextTrack = create<TimedTextTrackState>((set, get) => {
  return {
    addMultipleResources: (timedTextTracksToAdd: TimedText[]) =>
      set(
        addMultipleResources(
          get(),
          modelName.TIMEDTEXTTRACKS,
          timedTextTracksToAdd,
        ) as TimedTextTrackStore,
      ),
    addResource: (timedTextTrack: TimedText) =>
      set(
        addResource<TimedText>(
          get(),
          modelName.TIMEDTEXTTRACKS,
          timedTextTrack,
        ) as TimedTextTrackStore,
      ),
    getTimedTextTracks: () => {
      return Object.values(get()[modelName.TIMEDTEXTTRACKS]);
    },
    removeResource: (timedTextTrack: TimedText) =>
      set(
        removeResource(
          get(),
          modelName.TIMEDTEXTTRACKS,
          timedTextTrack,
        ) as TimedTextTrackStore,
      ),
    [modelName.TIMEDTEXTTRACKS]: {},
    reset: () => {
      set({ [modelName.TIMEDTEXTTRACKS]: {} });
    },
  };
});
