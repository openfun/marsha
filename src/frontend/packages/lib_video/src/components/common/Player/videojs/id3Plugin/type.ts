import videojs, { Player } from 'video.js';
import PluginType from 'video.js/dist/types/plugin';

const Plugin = videojs.getPlugin('plugin') as typeof PluginType;
export class id3PluginClass extends Plugin {
  declare player: Player;

  constructor(player: Player, _options?: unknown) {
    super(player);
  }
}

export type id3PluginType = typeof id3PluginClass;
