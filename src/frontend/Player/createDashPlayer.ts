import { MediaPlayer, MediaPlayerClass, MediaPlayerSettingClass } from 'dashjs';

import { Video } from '../types/tracks';

export const createDashPlayer = (video: Video, videoNode: HTMLVideoElement) => {
  const dash = MediaPlayer().create();
  dash.initialize(videoNode, video.urls.manifests.dash, false);
  dash.updateSettings({
    streaming: {
      abr: {
        initialBitrate: {
          video: 1600,
        },
      },
      fastSwitchEnabled: true,
    },
  } as MediaPlayerSettingClass);

  return dash;
};
