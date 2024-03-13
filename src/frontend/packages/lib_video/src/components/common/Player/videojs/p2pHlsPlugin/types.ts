import videojs, { Player } from 'video.js';
import PluginType from 'video.js/dist/types/plugin';

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

const Plugin = videojs.getPlugin('plugin') as typeof PluginType;
export class P2pHlsPlugin extends Plugin {
  declare player: Player;

  constructor(player: Player, _options?: unknown) {
    super(player);
  }
}

export type P2pHlsPluginType = typeof P2pHlsPlugin;
