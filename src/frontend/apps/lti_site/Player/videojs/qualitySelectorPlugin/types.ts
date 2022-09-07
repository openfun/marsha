import videojs from 'video.js';

export enum Events {
  QUALITY_REQUESTED = 'qualityRequested',
  PLAYER_SOURCES_CHANGED = 'playerSourcesChanged',
}

export interface QualitySelectorMenuItemOptions
  extends videojs.MenuItemOptions {
  label: string;
  size: string;
  src: string;
  type: string;
}

export interface QualitySelectorOptions {
  default?: string;
}
