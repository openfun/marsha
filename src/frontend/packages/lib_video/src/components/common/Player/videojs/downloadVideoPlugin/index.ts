import videojs from 'video.js';

import './components/DownloadVideoButton';
import './components/DownloadVideoQualityItem';
import { DownloadVideoPluginOptions } from './types';

const Plugin = videojs.getPlugin('plugin');

export class DownloadVideoPlugin extends Plugin {
  constructor(player: videojs.Player, options: DownloadVideoPluginOptions) {
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
