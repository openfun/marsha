import videojs, { Player } from 'video.js';
import MenuButton from 'video.js/dist/types/menu/menu-button';
import MenuItemOptions from 'video.js/dist/types/menu/menu-item';

import { QualitySelectorMenuItem } from './QualitySelectorMenuItem';

const MenuButtonClass = videojs.getComponent(
  'MenuButton',
) as unknown as typeof MenuButton;

export class QualitySelectorMenuButton extends MenuButtonClass {
  declare player: () => Player;

  constructor(player: Player, options?: MenuItemOptions) {
    super(player, options);
  }

  createEl() {
    return videojs.dom.createEl('div', {
      className:
        'vjs-http-source-selector vjs-menu-button vjs-menu-button-popup vjs-control vjs-button',
    });
  }

  buildCSSClass() {
    return super.buildCSSClass() + ' vjs-icon-cog';
  }

  createItems() {
    const player = this.player();

    return player.options_.sources.map((source) => {
      return new QualitySelectorMenuItem(player, {
        label: `${source.size ?? ''}p`,
        size: source.size ?? '',
        src: source.src,
        type: source.type ?? '',
        selected: player.currentSrc().includes(source.src),
      });
    });
  }
}
