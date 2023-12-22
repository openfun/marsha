import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';
import MenuItem from 'video.js/dist/types/menu/menu-item';

import { SharedLiveMediaItemOptions } from '../types';

const MenuItemClass = videojs.getComponent(
  'MenuItem',
) as unknown as typeof MenuItem;

export class SharedMediaItem extends MenuItemClass {
  source: string | undefined;

  constructor(player: Player, options: Partial<SharedLiveMediaItemOptions>) {
    options.selectable = false;
    options.multiSelectable = false;

    super(player, options);
    this.setAttribute('title', options.label || '');
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

videojs.registerComponent(
  'SharedMediaItem',
  SharedMediaItem as unknown as typeof Component,
);
