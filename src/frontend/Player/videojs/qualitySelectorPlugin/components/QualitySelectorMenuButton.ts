import videojs from 'video.js';

import { QualitySelectorMenuItem } from './QualitySelectorMenuItem';

const MenuButton = videojs.getComponent('MenuButton');

export class QualitySelectorMenuButton extends MenuButton {
  constructor(player: videojs.Player, options?: videojs.MenuItemOptions) {
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
      .map((source) => {
        return new QualitySelectorMenuItem(this.player_, {
          label: `${source.size}p`,
          size: source.size!,
          src: source.src,
          type: source.type!,
          selected: source.src === this.player().currentSource().src,
        });
      });
  }
}
