import { Maybe } from 'lib-common';
import { Video } from 'lib-components';
import videojs, { Player } from 'video.js';
import PluginType from 'video.js/dist/types/plugin';

export interface XapiPluginOptions {
  video: Video;
  locale: Maybe<string>;
  dispatchPlayerTimeUpdate: (time: number) => void;
}

const Plugin = videojs.getPlugin('plugin') as typeof PluginType;
export class XapiPlugin extends Plugin {
  declare player: Player;

  constructor(player: Player, _options?: XapiPluginOptions) {
    super(player);
  }
}

export type XapiPluginType = typeof XapiPlugin;
