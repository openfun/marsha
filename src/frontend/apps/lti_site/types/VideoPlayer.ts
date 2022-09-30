import { Maybe } from 'lib-common';
import { VideoJsPlayer } from 'video.js';

import { Video, TimedText } from 'types/tracks';

export interface VideoPlayerInterface {
  addTrack(track: TimedText, languages: { [key: string]: string }): void;
  removeTrack(track: TimedText): void;
  /** Destroy the instance and garbage collect any elements. */
  destroy(): void;
  getSource(): string;
  setSource(url: string): void;
}

export type VideoPlayerCreator = (
  type: string,
  ref: HTMLVideoElement,
  dispatchPlayerTimeUpdate: (time: number) => void,
  video: Video,
  locale?: string,
  onReady?: (player: VideoJsPlayer) => void,
) => Maybe<VideoPlayerInterface>;
