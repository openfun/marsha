import { VideoPlayerCreator } from '../types/VideoPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

export const createPlayer: VideoPlayerCreator = (
  type,
  ref,
  jwt,
  dispatchPlayerTimeUpdate,
) => {
  switch (type) {
    case 'plyr':
      return createPlyrPlayer(ref, jwt, dispatchPlayerTimeUpdate);
  }
};
