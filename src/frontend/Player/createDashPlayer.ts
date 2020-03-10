import { MediaPlayer, MediaPlayerClass, MediaPlayerSettingClass } from 'dashjs';

import { Video } from '../types/tracks';

export const createDashPlayer = (
  video: Video,
  videoNode: HTMLVideoElement,
): MediaPlayerClass => {
  const dash = MediaPlayer().create();
  dash.initialize(videoNode, video.urls.manifests.dash, false);
  dash.updateSettings({
    streaming: {
      abr: {
        initialBitrate: {
          video: 1600, // 480p
        },
        maxBitrate: {
          video: 2400, // 720p
        },
      },
      fastSwitchEnabled: true,
    },
  } as MediaPlayerSettingClass);

  return dash;
};
