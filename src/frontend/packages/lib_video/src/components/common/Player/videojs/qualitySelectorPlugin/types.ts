import MenuItem from 'video.js/dist/types/menu/menu-item';

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
