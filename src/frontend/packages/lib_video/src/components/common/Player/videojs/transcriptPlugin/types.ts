import { Nullable } from 'lib-common';
import { TimedTextTranscript, Video } from 'lib-components';
import videojs, { Player } from 'video.js';
import MenuItemOptions from 'video.js/dist/types/menu/menu-item';
import PluginType from 'video.js/dist/types/plugin';

const Plugin = videojs.getPlugin('plugin') as typeof PluginType;

export interface TranscriptItemOptions extends MenuItemOptions {
  label: string;
  transcript: Nullable<TimedTextTranscript>;
}

export interface TranscriptPluginOptions {
  video: Video;
}

export interface TranscriptButtonOptions {
  transcripts: TimedTextTranscript[];
}

export class TranscriptPlugin extends Plugin {
  declare player: Player;

  constructor(player: Player, _options?: TranscriptPluginOptions) {
    super(player);
  }
}

export type TranscriptPluginType = typeof TranscriptPlugin;
