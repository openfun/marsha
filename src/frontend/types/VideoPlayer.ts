import { Maybe } from 'utils/types';
import { Video } from './tracks';

export interface VideoPlayerInterface {
  /** Destroy the instance and garbage collect any elements. */
  destroy(): void;
}

export type VideoPlayerCreator = (
  type: string,
  ref: HTMLVideoElement,
  dispatchPlayerTimeUpdate: (time: number) => void,
  video: Video,
) => Maybe<VideoPlayerInterface>;
