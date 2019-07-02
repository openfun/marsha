import { VideoPlayerCreator } from '../types/VideoPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

export const createPlayer: VideoPlayerCreator = async (
  type,
  ref,
  dispatchPlayerTimeUpdate,
) => {
  switch (type) {
    case 'plyr':
      return await createPlyrPlayer(ref, dispatchPlayerTimeUpdate);
  }
};
