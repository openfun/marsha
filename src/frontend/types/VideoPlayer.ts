import { Maybe } from 'utils/types';
import { VideoJsPlayer } from 'video.js';
import { Video } from './tracks';

export interface VideoPlayerInterface {
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
  onReady?: (player: VideoJsPlayer) => void,
) => Maybe<VideoPlayerInterface>;
