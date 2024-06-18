import videojs from 'video.js';

import { DownloadVideoQualityItemOptions, Events } from '../types';

const Component = videojs.getComponent('Component');
const MenuItem = videojs.getComponent('MenuItem');

export class DownloadVideoQualityItem extends MenuItem {
  source: string | undefined;
  quality: string | undefined;

  constructor(
    player: videojs.Player,
    options: DownloadVideoQualityItemOptions,
  ) {
    options.selectable = false;
    options.multiSelectable = false;

    super(player, options);
    this.setAttribute('title', options.label);
    this.source = options.src;
    this.quality = options.label;
  }

  handleClick() {
    if (this.source) {
      this.downloadVideoQuality(this.source);
    }

    this.player().trigger(Events.DOWNLOAD, this.quality);
  }

  downloadVideoQuality(source: string) {
    const link = document.createElement('a');
    link.href = source;
    link.download = '';
    link.click();
  }
}

Component.registerComponent('DownloadVideoMenuItem', DownloadVideoQualityItem);
