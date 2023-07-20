import { videoSize } from '@lib-components/types';
import videojs, { Player } from 'video.js';
import { MenuButton } from 'video.js/dist/types/menu/menu-button';

import { DownloadVideoPluginOptions } from '../types';

import { DownloadVideoQualityItem } from './DownloadVideoQualityItem';

const MenuButtonClass = videojs.getComponent('MenuButton');

export class DownloadVideoButton extends MenuButtonClass {
  constructor(player: Player, options?: MenuButtonClass) {
    super(player, options);
    this.menuButton_.setAttribute('aria-label', 'Download Video');
  }

  createEl() {
    return videojs.dom.createEl('div', {
      className:
        'vjs-http-download-video vjs-menu-button vjs-menu-button-popup vjs-control vjs-button',
    });
  }

  buildCSSClass() {
    return super.buildCSSClass() + ' vjs-icon-download';
  }

  createItems() {
    const { urls } = this.options_ as DownloadVideoPluginOptions;
    return Object.keys(urls)
      .map((size) => Number(size) as videoSize)
      .sort((a, b) => b - a)
      .map(
        (size) =>
          new DownloadVideoQualityItem(this.player_, {
            label: `${size}p`,
            src: urls[size],
          }),
      );
  }
}

videojs.registerComponent('DownloadVideoButton', DownloadVideoButton);
