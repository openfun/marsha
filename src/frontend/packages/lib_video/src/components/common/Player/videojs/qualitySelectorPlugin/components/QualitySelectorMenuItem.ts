import videojs, { Player } from 'video.js';
import Component from 'video.js/dist/types/component';
import { Event } from 'video.js/dist/types/event-target';
import MenuItem from 'video.js/dist/types/menu/menu-item';

import { Events, QualitySelectorMenuItemOptions } from '../types';

const MenuItemClass = videojs.getComponent(
  'MenuItem',
) as unknown as typeof MenuItem;

export class QualitySelectorMenuItem extends MenuItemClass {
  constructor(player: Player, options: QualitySelectorMenuItemOptions) {
    options.selectable = true;
    options.multiSelectable = false;

    super(player, options);

    this.on(Events.QUALITY_REQUESTED, this.qualityRequested.bind(this));
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
  QualitySelectorMenuItem as unknown as Component,
);
