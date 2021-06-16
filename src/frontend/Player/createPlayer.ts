import { pollForLive } from '../data/sideEffects/pollForLive';
import { VideoPlayerCreator } from '../types/VideoPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';
import { report } from '../utils/errors/report';

export const createPlayer: VideoPlayerCreator = async (
  type,
  ref,
  dispatchPlayerTimeUpdate,
  video,
) => {
  if (video.live_state) {
    ref.classList.add('offscreen');
    await pollForLive(video.urls!);
    ref.classList.remove('offscreen');
  }

  switch (type) {
    case 'videojs':
      const player = createVideojsPlayer(
        ref,
        dispatchPlayerTimeUpdate,
        video.urls!,
        video.live_state,
      );
      return {
        destroy: () => player.dispose(),
      };
    default:
      report(new Error(`player ${type} not implemented`));
  }
};
