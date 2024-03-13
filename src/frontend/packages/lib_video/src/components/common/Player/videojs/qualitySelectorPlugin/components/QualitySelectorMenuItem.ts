import videojs, { Player, Source } from 'video.js';
import Component from 'video.js/dist/types/component';
import MenuItem from 'video.js/dist/types/menu/menu-item';

import { Events, QualitySelectorMenuItemOptions } from '../types';

const MenuItemClass = videojs.getComponent(
  'MenuItem',
) as unknown as typeof MenuItem;

interface MenuItemSources extends Source {
  label: string;
}

export class QualitySelectorMenuItem extends MenuItemClass {
  constructor(player: Player, options: MenuItemSources) {
    super(player, {
      ...options,
      selectable: true,
      multiSelectable: false,
    });

    player.on(Events.QUALITY_REQUESTED, this.qualityRequested.bind(this));
  }

  qualityRequested(
    _event: Events,
    selectedItem: QualitySelectorMenuItemOptions,
  ) {
    const currentItem = this.options_ as QualitySelectorMenuItemOptions;
    this.selected(selectedItem.src === currentItem.src);
  }

  handleClick(event: Event) {
    const selected = this.options_ as QualitySelectorMenuItemOptions;
    super.handleClick(event);

    this.player().trigger(Events.QUALITY_REQUESTED, selected);
  }
}

videojs.registerComponent(
  'QualitySelectorMenuItem',
  QualitySelectorMenuItem as unknown as typeof Component,
);
