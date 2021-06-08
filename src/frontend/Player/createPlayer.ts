import { VideoPlayerCreator } from '../types/VideoPlayer';
import { createVideojsPlayer } from './createVideojsPlayer';
import { report } from '../utils/errors/report';
import { VideoUrls } from '../types/tracks';

const pollForLive = async (urls: VideoUrls): Promise<null> => {
  try {
    const response = await fetch(urls.manifests.hls);
    if (response.status === 404) {
      throw new Error('missing manifest');
    }
  } catch (error) {
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    return await pollForLive(urls);
  }

  return null;
};

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
