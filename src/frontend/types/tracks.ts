import { Nullable } from '../utils/types';
import { Document } from './file';

/** Base shape for all resources to extend. */
export interface Resource {
  id: string;
}

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

export enum liveState {
  IDLE = 'idle',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPED = 'stopped',
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

export interface Playlist {
  title: string;
  lti_id: string;
}

/** A timed text track record as it exists on the backend. */
export interface TimedText extends Resource {
  active_stamp: Nullable<number>;
  is_ready_to_show: boolean;
  language: string;
  mode: timedTextMode;
  upload_state: uploadState;
  source_url: Nullable<string>;
  url: string;
  video: Video['id'];
  title: string;
}

export interface TimedTextTranscript extends TimedText {
  mode: timedTextMode.TRANSCRIPT;
}

/** Possible sizes for an image, a video or stream. Used as keys in lists of files. */
export type videoSize = 144 | 240 | 480 | 720 | 1080;

/** An URLs property that includes URLs for each possible visual size */
export type urls = { [key in videoSize]?: string };

/** A Thumbnail record as it exists on the backend. */
export interface Thumbnail extends Resource {
  is_ready_to_show: boolean;
  upload_state: uploadState;
  urls: urls;
  active_stamp: Nullable<number>;
  video: Video['id'];
}

/** A Video record as it exists on the backend. */
export interface Video extends Resource {
  description: string;
  is_ready_to_show: boolean;
  show_download: boolean;
  thumbnail: Nullable<Thumbnail>;
  timed_text_tracks: TimedText[];
  title: string;
  upload_state: uploadState;
  urls: {
    manifests: {
      dash: string;
      hls: string;
    };
    mp4: Partial<urls>;
    thumbnails: Partial<urls>;
  };
  should_use_subtitle_as_transcript: boolean;
  has_transcript: boolean;
  playlist: Playlist;
  live_state: Nullable<liveState>;
  live_info: {
    medialive?: {
      input: {
        endpoints: string[];
      };
    };
  };
}

export type UploadableObject = TimedText | Video | Thumbnail | Document;
