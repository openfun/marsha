import { pollForLive } from 'data/sideEffects/pollForLive';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { VideoPlayerCreator } from 'types/VideoPlayer';
import { report } from 'utils/errors/report';

import { createVideojsPlayer } from './createVideojsPlayer';

export const createPlayer: VideoPlayerCreator = async (
  type,
  ref,
  dispatchPlayerTimeUpdate,
  video,
) => {
  if (video.live_state && video.urls) {
    ref.classList.add('offscreen');
    await pollForLive(video.urls);
    ref.classList.remove('offscreen');
    useLiveStateStarted.getState().setIsStarted(true);
  }

  switch (type) {
    case 'videojs':
      const player = createVideojsPlayer(ref, dispatchPlayerTimeUpdate, video);
      return {
        destroy: () => player.dispose(),
        getSource: () => player.currentSource().src,
        setSource: (url: string) => player.src(url),
      };
    default:
      report(new Error(`player ${type} not implemented`));
  }
};
