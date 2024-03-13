import { urls } from 'lib-components';
import videojs, { Player } from 'video.js';
import MenuItemOptions from 'video.js/dist/types/menu/menu-item';
import PluginType from 'video.js/dist/types/plugin';

const Plugin = videojs.getPlugin('plugin') as typeof PluginType;

export interface DownloadVideoQualityItemOptions extends MenuItemOptions {
  label: string;
  src: string | undefined;
}

export interface DownloadVideoPluginOptions {
  urls: Partial<urls>;
}

export class DownloadVideoPlugin extends Plugin {
  declare player: Player;

  constructor(player: Player, _options?: DownloadVideoPluginOptions) {
    super(player);
  }
}

export type DownloadVideoPluginType = typeof DownloadVideoPlugin;
