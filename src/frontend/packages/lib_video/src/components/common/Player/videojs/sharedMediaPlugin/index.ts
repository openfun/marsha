import videojs, { Player } from 'video.js';

import './components/SharedMediaButton';
import './components/SharedMediaItem';
import { SharedLiveMediaOptions, SharedLiveMediaType } from './types';

const PluginClass = videojs.getPlugin('plugin') as SharedLiveMediaType;

export class SharedMediaPlugin extends PluginClass {
  constructor(player: Player, options: SharedLiveMediaOptions) {
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
