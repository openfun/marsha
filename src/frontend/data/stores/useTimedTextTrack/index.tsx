import create from 'zustand';

import { ModelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { TimedText } from '../../../types/tracks';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

type TimedTextTrackState = StoreState<TimedText> & {
  getTimedTextTracks: () => TimedText[];
  [ModelName.TIMEDTEXTTRACKS]: {
    [id: string]: TimedText;
  };
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
          ModelName.TIMEDTEXTTRACKS,
          timedTextTracksToAdd,
        ),
      ),
    addResource: (timedTextTrack: TimedText) =>
      set(
        addResource<TimedText>(
          get(),
          ModelName.TIMEDTEXTTRACKS,
          timedTextTrack,
        ),
      ),
    getTimedTextTracks: () => {
      return Object.values(get()[ModelName.TIMEDTEXTTRACKS]);
    },
    removeResource: (timedTextTrack: TimedText) =>
      set(removeResource(get(), ModelName.TIMEDTEXTTRACKS, timedTextTrack)),
    [ModelName.TIMEDTEXTTRACKS]: timedTextTracks,
  };
});
