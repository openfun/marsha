import { videoSize } from '@lib-components/types';
import { getIntl } from 'lib-common';
import { defineMessages } from 'react-intl';
import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';
import MenuButton from 'video.js/dist/types/menu/menu-button';
import MenuItemOptions from 'video.js/dist/types/menu/menu-item';

import { DownloadVideoPluginOptions } from '../types';

import { DownloadVideoQualityItem } from './DownloadVideoQualityItem';

const MenuButtonClass = videojs.getComponent(
  'MenuButton',
) as unknown as typeof MenuButton;
const messages = defineMessages({
  downloadVideoButton: {
    defaultMessage: 'Download Video',
    description: 'Title of the download video button inside the video player.',
    id: 'videojs.menu.downloadVideoButton',
  },
});
export class DownloadVideoButton extends MenuButtonClass {
  declare player: () => Player;

  constructor(player: Player, options?: MenuItemOptions) {
    super(player, options);
    this.menuButton_.setAttribute(
      'title',
      getIntl().formatMessage(messages.downloadVideoButton),
    );
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
          new DownloadVideoQualityItem(this.player(), {
            label: `${size}p`,
            src: urls[size],
          }),
      );
  }
}

videojs.registerComponent(
  'DownloadVideoButton',
  DownloadVideoButton as unknown as typeof Component,
);
