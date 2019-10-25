import { VideoPlayerCreator } from '../types/VideoPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

export const createPlayer: VideoPlayerCreator = (
  type,
  ref,
  dispatchPlayerTimeUpdate,
  video,
) => {
  switch (type) {
    case 'plyr':
      return createPlyrPlayer(ref, dispatchPlayerTimeUpdate, video);
  }
};
