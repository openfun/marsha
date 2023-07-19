import videojs from 'video.js';

import { DownloadVideoQualityItemOptions } from '../types';

const Component = videojs.getComponent('Component');
const MenuItem = videojs.getComponent('MenuItem');

export class DownloadVideoQualityItem extends MenuItem {
  source: string | undefined;

  constructor(
    player: videojs.Player,
    options: DownloadVideoQualityItemOptions,
  ) {
    options.selectable = false;
    options.multiSelectable = false;

    super(player, options);
    this.source = options.src;
  }

  handleClick() {
    if (this.source) {
      const link = document.createElement('a');
      link.href = this.source;
      link.click();
    }
  }
}

Component.registerComponent('DownloadVideoMenuItem', DownloadVideoQualityItem);
