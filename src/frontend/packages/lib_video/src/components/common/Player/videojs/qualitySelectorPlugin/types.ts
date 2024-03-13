import videojs, { Player } from 'video.js';
import MenuItem from 'video.js/dist/types/menu/menu-item';
import PluginType from 'video.js/dist/types/plugin';

const Plugin = videojs.getPlugin('plugin') as typeof PluginType;

export enum Events {
  QUALITY_REQUESTED = 'qualityRequested',
  PLAYER_SOURCES_CHANGED = 'playerSourcesChanged',
}

export interface QualitySelectorMenuItemOptions extends MenuItem {
  label: string;
  size: string;
  src: string;
  type: string;
}

export interface QualitySelectorOptions {
  default?: string;
}

export class QualitySelector extends Plugin {
  qualitySelector?: QualitySelectorOptions;
  declare player: Player;

  constructor(player: Player, _options?: QualitySelectorOptions) {
    super(player);
  }
}

export type QualitySelectorType = typeof QualitySelector;
