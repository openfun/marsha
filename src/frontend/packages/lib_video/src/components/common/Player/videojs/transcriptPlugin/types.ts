import { Nullable } from 'lib-common';
import { TimedTextTranscript, Video } from 'lib-components';
import videojs from 'video.js';

export interface SharedLiveMediaItemOptions extends videojs.MenuItemOptions {
  label: string;
  transcript: Nullable<TimedTextTranscript>;
}

export interface TranscriptPluginOptions {
  video: Video;
}

export interface TranscriptButtonOptions {
  transcripts: TimedTextTranscript[];
}
