import { create } from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import { modelName } from 'types/models';
import { StoreState } from 'types/stores';
import { TimedText } from 'types/tracks';

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
