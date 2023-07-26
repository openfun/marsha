import { TimedTextTranscript, useTimedTextTrack } from 'lib-components';
import videojs from 'video.js';

import { SharedLiveMediaItemOptions } from '../types';

import { TranscriptButton } from './TranscriptButton';

const Component = videojs.getComponent('Component');
const MenuItem = videojs.getComponent('MenuItem');

export class TranscriptItem extends MenuItem {
  transcript: TimedTextTranscript | null;

  constructor(player: videojs.Player, options: SharedLiveMediaItemOptions) {
    options.selectable = true;
    options.multiSelectable = false;
    super(player, options);
    this.setAttribute('title', options.label);
    this.transcript = options.transcript;
    this.selected(
      useTimedTextTrack.getState().selectedTranscript === this.transcript,
    );
  }

  handleClick() {
    const menuButton = this.player().controlBar.getDescendant(
      'transcriptButton',
    ) as TranscriptButton & { items: TranscriptItem[] };

    if (menuButton && menuButton instanceof TranscriptButton) {
      menuButton.items.forEach((menuItem) => {
        if (menuItem instanceof TranscriptItem && menuItem !== this) {
          menuItem.selected(false);
        }
      });
    }

    this.selected(true);
    useTimedTextTrack.getState().setSelectedTranscript(this.transcript);
  }
}

Component.registerComponent('TranscriptItem', TranscriptItem);
