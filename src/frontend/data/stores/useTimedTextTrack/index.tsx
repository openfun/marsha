import create from 'zustand';

import { modelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { TimedText } from '../../../types/tracks';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

interface TimedTextTrackState extends StoreState<TimedText> {
  getTimedTextTracks: () => TimedText[];
  [modelName.TIMEDTEXTTRACKS]: {
    [id: string]: TimedText;
  };
}

export const [useTimedTextTrack, useTimedTextTrackApi] = create<
  TimedTextTrackState
>((set, get) => {
  const timedTextTracks: { [id: string]: TimedText } = {};

  if (appData.video && appData.video.timed_text_tracks.length > 0) {
    appData.video.timed_text_tracks.forEach(
      timedTextTrack => (timedTextTracks[timedTextTrack.id] = timedTextTrack),
    );
  }

  return {
    addMultipleResources: (timedTextTracksToAdd: TimedText[]) =>
      set(
        addMultipleResources(
          get(),
          modelName.TIMEDTEXTTRACKS,
          timedTextTracksToAdd,
        ),
      ),
    addResource: (timedTextTrack: TimedText) =>
      set(
        addResource<TimedText>(
          get(),
          modelName.TIMEDTEXTTRACKS,
          timedTextTrack,
        ),
      ),
    getTimedTextTracks: () => {
      return Object.values(get()[modelName.TIMEDTEXTTRACKS]);
    },
    removeResource: (timedTextTrack: TimedText) =>
      set(removeResource(get(), modelName.TIMEDTEXTTRACKS, timedTextTrack)),
    [modelName.TIMEDTEXTTRACKS]: timedTextTracks,
  };
});
