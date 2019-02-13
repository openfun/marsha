import { Dispatch } from 'redux';

import {
  VideoPlayerInterface,
  VideoPlayerType,
} from 'types/VideoPlayerInterface';
import { createPlyrPlayer } from './createPlyrPlayer';

export const createPlayer = (
  type: VideoPlayerType,
  ref: HTMLVideoElement,
  jwt: string,
  dispatch: Dispatch,
): VideoPlayerInterface => {
  switch (type) {
    case 'plyr':
      return createPlyrPlayer(ref, jwt, dispatch);
  }
};
