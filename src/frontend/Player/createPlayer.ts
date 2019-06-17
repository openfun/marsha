import { VideoPlayerCreator } from '../types/VideoPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';

export const createPlayer: VideoPlayerCreator = (type, ref, jwt, dispatch) => {
  switch (type) {
    case 'plyr':
      return createPlyrPlayer(ref, jwt, dispatch);
  }
};
