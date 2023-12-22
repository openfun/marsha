import { getIntl } from 'lib-common';
import { defineMessages } from 'react-intl';
import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';
import MenuButton from 'video.js/dist/types/menu/menu-button';
import MenuItemOptions from 'video.js/dist/types/menu/menu-item';

import { SharedLiveMediaOptions } from '../types';

import { SharedMediaItem } from './SharedMediaItem';

const MenuButtonClass = videojs.getComponent(
  'MenuButton',
) as unknown as typeof MenuButton;

const messages = defineMessages({
  sharedMediaButton: {
    defaultMessage: 'Shared Media',
    description: 'Title of the shared media button inside the video player.',
    id: 'videojs.menu.sharedMediaButton',
  },
});

export class SharedMediaButton extends MenuButtonClass {
  declare player: () => Player;

  constructor(player: Player, options?: MenuItemOptions) {
    super(player, options);
    this.menuButton_.setAttribute(
      'title',
      getIntl().formatMessage(messages.sharedMediaButton),
    );
  }

  createEl() {
    return videojs.dom.createEl('div', {
      className:
        'vjs-http-download-video vjs-menu-button vjs-menu-button-popup vjs-control vjs-button',
    });
  }

  buildCSSClass() {
    return super.buildCSSClass() + ' vjs-icon-shared-media';
  }

  createItems() {
    const { sharedLiveMedias } = this.options_ as SharedLiveMediaOptions;
    return sharedLiveMedias.map((item) => {
      return new SharedMediaItem(this.player(), {
        label: item.title || '',
        src: item.urls ? item.urls.media : undefined,
      });
    });
  }
}

videojs.registerComponent(
  'SharedMediaButton',
  SharedMediaButton as unknown as typeof Component,
);
