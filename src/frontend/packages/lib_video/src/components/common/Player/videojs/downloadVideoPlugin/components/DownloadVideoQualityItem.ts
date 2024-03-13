import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';
import MenuItem from 'video.js/dist/types/menu/menu-item';

import { DownloadVideoQualityItemOptions } from '../types';

const MenuItemClass = videojs.getComponent(
  'MenuItem',
) as unknown as typeof MenuItem;

export class DownloadVideoQualityItem extends MenuItemClass {
  source: string | undefined;

  constructor(
    player: Player,
    options: Partial<DownloadVideoQualityItemOptions>,
  ) {
    options.selectable = false;
    options.multiSelectable = false;

    super(player, options);
    this.setAttribute('title', options.label || '');
    this.source = options.src;
  }

  handleClick() {
    if (this.source) {
      this.downloadVideoQuality(this.source);
    }
  }

  downloadVideoQuality(source: string) {
    const link = document.createElement('a');
    link.href = source;
    link.download = '';
    link.click();
  }
}

videojs.registerComponent(
  'DownloadVideoMenuItem',
  DownloadVideoQualityItem as unknown as typeof Component,
);
