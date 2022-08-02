import create from 'zustand';

import { appData } from 'data/appData';
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

type TimedTextTrackState = StoreState<TimedText> &
  TimedTextTrackStore & {
    getTimedTextTracks: () => TimedText[];
  };

export const useTimedTextTrack = create<TimedTextTrackState>((set, get) => {
  const timedTextTracks: { [id: string]: TimedText } = {};

  if (appData.video && appData.video.timed_text_tracks.length > 0) {
    appData.video.timed_text_tracks.forEach(
      (timedTextTrack) => (timedTextTracks[timedTextTrack.id] = timedTextTrack),
    );
  }

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
    [modelName.TIMEDTEXTTRACKS]: timedTextTracks,
  };
});
