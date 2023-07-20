import videojs, { Player } from 'video.js';
import MenuButton from 'video.js/dist/types/menu/menu-button';
import MenuItemOptions from 'video.js/dist/types/menu/menu-item';

import { QualitySelectorMenuItemOptions } from '../types';

import { QualitySelectorMenuItem } from './QualitySelectorMenuItem';

const MenuButtonClass = videojs.getComponent(
  'MenuButton',
) as unknown as typeof MenuButton;

export class QualitySelectorMenuButton extends MenuButtonClass {
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
    return this.player()
      .currentSources()
      .map((_source) => {
        return new QualitySelectorMenuItem(
          this.player_ as Player,
          {
            label: ``,
            size: '',
            src: '',
            type: '',
            selected: '',
            // label: `${source.size ?? ''}p`,
            // size: source.size ?? '',
            // src: source.src,
            // type: source.type ?? '',
            // selected: source.src === this.player().currentSource().src,
          } as QualitySelectorMenuItemOptions,
        );
      });
  }
}
