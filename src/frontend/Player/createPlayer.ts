import { VideoPlayerCreator } from '../types/VideoPlayer';
import { createPlyrPlayer } from './createPlyrPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';
import { report } from '../utils/errors/report';

export const createPlayer: VideoPlayerCreator = (
  type,
  ref,
  dispatchPlayerTimeUpdate,
  video,
) => {
  switch (type) {
    case 'plyr':
      return createPlyrPlayer(ref, dispatchPlayerTimeUpdate, video.urls!);
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
