import { SharedLiveMedia } from '@lib-components/types/tracks';
import videojs, { Player } from 'video.js';
import MenuItemOptions from 'video.js/dist/types/menu/menu-item';
import PluginType from 'video.js/dist/types/plugin';

export interface SharedLiveMediaItemOptions extends MenuItemOptions {
  label: string;
  src: string | undefined;
}

export interface SharedLiveMediaOptions {
  sharedLiveMedias: SharedLiveMedia[];
}

const Plugin = videojs.getPlugin('plugin') as typeof PluginType;
export class SharedLiveMediaClass extends Plugin {
  declare player: Player;

  constructor(player: Player, _options?: SharedLiveMediaOptions) {
    super(player);
  }
}

export type SharedLiveMediaType = typeof SharedLiveMediaClass;
