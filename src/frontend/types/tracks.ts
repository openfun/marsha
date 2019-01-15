import { Nullable } from '../utils/types';
import { Resource } from './Resource';

/** Possible states for a track upload, whether video or other such as timed text.
 *
 * NB: PENDING, PROCESSING, READY and ERROR are the actual possible values
 * for the state field on a video record.
 *
 * UPLOADING does not exist as a track state on the backend side, as during
 * upload the model value for the state is still PENDING. However, here
 * on the frontend, they are two different states as far as the user is concerned,
 * especially when it comes to videos which might take a long time to upload.
 *
 * We add it in to make it easier to work with those states. It should not actually be
 * applied on any Video or other track record but will be used as a stand-in in our local
 * track representations and whenever we might need to pass such state information around.
 */
export enum uploadState {
  ERROR = 'error',
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  UPLOADING = 'uploading',
}

/** Possible modes for a timed text track.
 *
 * We're using modes instead of different objects to represent subtitles, transcripts and closed captions
 * as they're both the same types of files that go through the same pipelines, and have the same kinds
 * of relations to video tracks.
 */
export enum timedTextMode {
  SUBTITLE = 'st',
  TRANSCRIPT = 'ts',
  CLOSED_CAPTIONING = 'cc',
}

/** A timed text track record as it exists on the backend. */
export interface TimedText extends Resource {
  active_stamp: Nullable<number>;
  is_ready_to_play: boolean;
  language: string;
  mode: timedTextMode;
  uploaded_on: string;
  upload_state: uploadState;
  url: string;
  video: Video;
}

/** Possible sizes for a video file or stream. Used as keys in lists of files. */
export type videoSize = '144' | '240' | '480' | '720' | '1080';

/** A Video record as it exists on the backend. */
export interface Video extends Resource {
  description: string;
  id: string;
  is_ready_to_play: boolean;
  title: string;
  upload_state: uploadState;
  urls: {
    manifests: {
      dash: string;
      hls: string;
    };
    mp4: { [key in videoSize]: string };
    thumbnails: { [key in videoSize]: string };
  };
}

export type UploadableObject = TimedText | Video;
