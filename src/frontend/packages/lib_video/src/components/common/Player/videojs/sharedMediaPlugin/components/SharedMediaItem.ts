import videojs from 'video.js';

import { SharedLiveMediaItemOptions } from '../types';

const Component = videojs.getComponent('Component');
const MenuItem = videojs.getComponent('MenuItem');

export class SharedMediaItem extends MenuItem {
  source: string | undefined;

  constructor(player: videojs.Player, options: SharedLiveMediaItemOptions) {
    options.selectable = false;
    options.multiSelectable = false;

    super(player, options);
    this.setAttribute('title', options.label);
    this.source = options.src;
  }

  handleClick() {
    if (this.source) {
      this.downloadSharedMediaItem(this.source);
    }
  }

  downloadSharedMediaItem(source: string) {
    const link = document.createElement('a');
    link.href = source;
    link.click();
  }
}

Component.registerComponent('SharedMediaItem', SharedMediaItem);
