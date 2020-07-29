import Hls from 'hls.js';

import { Video } from '../types/tracks';

export const createHlsPlayer = (
  video: Video,
  videoNode: HTMLVideoElement,
): Hls => {
  const hls = new Hls({
    liveDurationInfinity: true,
    liveSyncDuration: 1,
  });
  hls.loadSource(video.urls.manifests.hls);
  hls.attachMedia(videoNode);

  return hls;
};
