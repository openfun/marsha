import create from 'zustand';

import { TimedText } from '../../../types/tracks';
import { appData } from '../../appData';

interface State {
  getTimedTextTracks: () => TimedText[];
  timedTextTracks: {
    [id: string]: TimedText;
  };
}

export const [useTimedTextTrack] = create<State>((set, get) => {
  const timedTextTracks: { [id: string]: TimedText } = {};

  if (appData.video && appData.video.timed_text_tracks.length > 0) {
    appData.video.timed_text_tracks.forEach(
      timedTextTrack => (timedTextTracks[timedTextTrack.id] = timedTextTrack),
    );
  }

  return {
    getTimedTextTracks: () => {
      return Object.values(get().timedTextTracks);
    },
    timedTextTracks,
  };
});
