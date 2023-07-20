import Player from 'video.js/dist/types/player';

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
      func: (videojsPlayer: Player, hlsjs: Player) => void,
    ) => void;
  };
}
