import { getIntl } from 'lib-common';
import { defineMessages } from 'react-intl';
import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';
import MenuButton from 'video.js/dist/types/menu/menu-button';
import MenuItemOptions from 'video.js/dist/types/menu/menu-item';

import { TranscriptButtonOptions } from '../types';

import { TranscriptItem } from './TranscriptItem';

const MenuButtonClass = videojs.getComponent(
  'MenuButton',
) as unknown as typeof MenuButton;

const messages = defineMessages({
  transcriptButton: {
    defaultMessage: 'Transcript',
    description: 'Title of the transcript button inside the video player.',
    id: 'videojs.menu.transcriptButton',
  },
});

export class TranscriptButton extends MenuButtonClass {
  declare player: () => Player;

  constructor(player: Player, options: MenuItemOptions) {
    super(player, options);
    this.menuButton_.setAttribute(
      'title',
      getIntl().formatMessage(messages.transcriptButton),
    );
  }

  buildCSSClass() {
    return super.buildCSSClass() + ' vjs-icon-transcript';
  }

  createItems() {
    const { transcripts } = this.options_ as TranscriptButtonOptions;
    if (!transcripts || !transcripts.length) {
      return [];
    }
    return [
      new TranscriptItem(this.player(), {
        label: 'transcript off',
        transcript: null,
      }),
      ...transcripts.map((item) => {
        return new TranscriptItem(this.player(), {
          label: item.language,
          transcript: item,
        });
      }),
    ];
  }
}

videojs.registerComponent(
  'TranscriptButton',
  TranscriptButton as unknown as typeof Component,
);
