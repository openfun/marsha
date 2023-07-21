import { getIntl } from 'lib-common';
import { defineMessages } from 'react-intl';
import videojs from 'video.js';

import { SharedLiveMediaOptions } from '../types';

import { SharedMediaItem } from './SharedMediaItem';

const MenuButton = videojs.getComponent('MenuButton');

const messages = defineMessages({
  sharedMediaButton: {
    defaultMessage: 'Shared Media',
    description: 'Title of the shared media button inside the video player.',
    id: 'videojs.menu.sharedMediaButton',
  },
});

export class SharedMediaButton extends MenuButton {
  constructor(player: videojs.Player, options?: videojs.MenuItemOptions) {
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
      return new SharedMediaItem(this.player_, {
        label: item.title || '',
        src: item.urls ? item.urls.media : undefined,
      });
    });
  }
}

videojs.registerComponent('SharedMediaButton', SharedMediaButton);
