import { getIntl } from 'lib-common';
import { defineMessages } from 'react-intl';
import videojs from 'video.js';

import { TranscriptButtonOptions } from '../types';

import { TranscriptItem } from './TranscriptItem';

const MenuButton = videojs.getComponent('MenuButton');

const messages = defineMessages({
  transcriptButton: {
    defaultMessage: 'Transcript',
    description: 'Title of the transcript button inside the video player.',
    id: 'videojs.menu.transcriptButton',
  },
});

export class TranscriptButton extends MenuButton {
  constructor(player: videojs.Player, options: videojs.MenuButtonOptions) {
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
      new TranscriptItem(this.player_, {
        label: 'transcript off',
        transcript: null,
      }),
      ...transcripts.map((item) => {
        return new TranscriptItem(this.player_, {
          label: item.language,
          transcript: item,
        });
      }),
    ];
  }
}

videojs.registerComponent('TranscriptButton', TranscriptButton);
