import { useTimedTextTrack } from 'lib-components';
import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';
import MenuItem from 'video.js/dist/types/menu/menu-item';

import { TranscriptItemOptions } from '../types';

import { TranscriptButton } from './TranscriptButton';

const MenuItemClass = videojs.getComponent(
  'MenuItem',
) as unknown as typeof MenuItem;

export class TranscriptItem extends MenuItemClass {
  declare player: () => Player;
  transcript?: TranscriptItemOptions['transcript'];

  constructor(player: Player, options: Partial<TranscriptItemOptions>) {
    options.selectable = true;
    options.multiSelectable = false;
    super(player, options);
    this.setAttribute('title', options.label || '');
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

    if (this.transcript) {
      useTimedTextTrack.getState().setSelectedTranscript(this.transcript);
    }
  }
}

videojs.registerComponent(
  'TranscriptItem',
  TranscriptItem as unknown as typeof Component,
);
