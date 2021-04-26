import Hls from 'hls.js';
import { VideoUrls } from '../types/tracks';

export const createHlsPlayer = (
  urls: VideoUrls,
  videoNode: HTMLVideoElement,
): Hls => {
  const hls = new Hls({
    liveDurationInfinity: true,
    liveSyncDuration: 1,
  });
  hls.loadSource(urls.manifests.hls);
  hls.attachMedia(videoNode);

  return hls;
};
