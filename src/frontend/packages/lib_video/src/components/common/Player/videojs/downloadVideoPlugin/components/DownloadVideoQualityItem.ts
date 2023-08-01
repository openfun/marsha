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
    this.setAttribute('title', options.label);
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
    link.click();
  }
}

Component.registerComponent('DownloadVideoMenuItem', DownloadVideoQualityItem);
