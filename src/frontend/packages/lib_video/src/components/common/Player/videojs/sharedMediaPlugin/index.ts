import videojs from 'video.js';

import './components/SharedMediaButton';
import './components/SharedMediaItem';
import { SharedLiveMediaOptions } from './types';

const Plugin = videojs.getPlugin('plugin');

export class SharedMediaPlugin extends Plugin {
  constructor(player: videojs.Player, options: SharedLiveMediaOptions) {
    super(player, options);

    const controlBar = this.player.controlBar;
    const fullscreenToggle = controlBar.getChild('fullscreenToggle')?.el();
    controlBar.el().insertBefore(
      controlBar
        .addChild('SharedMediaButton', {
          sharedLiveMedias: options.sharedLiveMedias,
        })
        .el(),
      fullscreenToggle || null,
    );
  }
}

videojs.registerPlugin('sharedMediaPlugin', SharedMediaPlugin);
