import { VideoPlayerCreator } from 'types/VideoPlayer';
import { report } from 'utils/errors/report';

import { createVideojsPlayer } from './createVideojsPlayer';

export const createPlayer: VideoPlayerCreator = (
  type,
  ref,
  dispatchPlayerTimeUpdate,
  video,
  locale,
  onReady = undefined,
) => {
  switch (type) {
    case 'videojs':
      const player = createVideojsPlayer(
        ref,
        dispatchPlayerTimeUpdate,
        video,
        locale,
        onReady,
      );
      return {
        destroy: () => player.dispose(),
        getSource: () => player.currentSource().src,
        setSource: (url: string) => player.src(url),
      };
    default:
      report(new Error(`player ${type} not implemented`));
  }
};
