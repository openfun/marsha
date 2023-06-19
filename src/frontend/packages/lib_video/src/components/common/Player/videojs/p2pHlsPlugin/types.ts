import { VideoJsPlayer } from 'video.js';

export interface HlsData {
  frag: {
    url: string;
    byteRange: number[];
    start: number;
    duration: number;
  };
}

export interface ExtendedVideoJs {
  Html5Hlsjs: {
    addHook: (
      action: string,
      func: (videojsPlayer: unknown, hlsjs: VideoJsPlayer) => void,
    ) => void;
  };
}
