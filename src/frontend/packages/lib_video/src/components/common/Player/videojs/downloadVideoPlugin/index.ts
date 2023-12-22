import videojs, { Player } from 'video.js';

import './components/DownloadVideoButton';
import './components/DownloadVideoQualityItem';
import { DownloadVideoPluginOptions, DownloadVideoPluginType } from './types';

const Plugin = videojs.getPlugin('plugin') as DownloadVideoPluginType;

export class DownloadVideoPlugin extends Plugin {
  declare player: Player;

  constructor(player: Player, options: DownloadVideoPluginOptions) {
    super(player, options);

    const controlBar = this.player.controlBar;
    const fullscreenToggle = controlBar.getChild('fullscreenToggle')?.el();
    controlBar
      .el()
      .insertBefore(
        controlBar.addChild('DownloadVideoButton', { urls: options.urls }).el(),
        fullscreenToggle || null,
      );
  }
}

videojs.registerPlugin('downloadVideoPlugin', DownloadVideoPlugin);
