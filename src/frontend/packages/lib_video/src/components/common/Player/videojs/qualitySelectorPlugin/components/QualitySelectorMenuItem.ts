import videojs from 'video.js';

import { Events, QualitySelectorMenuItemOptions } from '../types';

const Component = videojs.getComponent('Component');
const MenuItem = videojs.getComponent('MenuItem');

export class QualitySelectorMenuItem extends MenuItem {
  constructor(player: videojs.Player, options: QualitySelectorMenuItemOptions) {
    options.selectable = true;
    options.multiSelectable = false;

    super(player, options);

    this.on(player, Events.QUALITY_REQUESTED, this.qualityRequested.bind(this));
  }

  qualityRequested(
    _event: Events,
    selectedItem: QualitySelectorMenuItemOptions,
  ) {
    const currentItem = this.options_ as QualitySelectorMenuItemOptions;
    this.selected(selectedItem.src === currentItem.src);
  }

  handleClick(event: videojs.EventTarget.Event) {
    const selected = this.options_ as QualitySelectorMenuItemOptions;
    super.handleClick(event);

    this.player().trigger(Events.QUALITY_REQUESTED, selected);
  }
}
Component.registerComponent('QualitySelectorMenuItem', QualitySelectorMenuItem);
