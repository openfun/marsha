import { Nullable } from '../utils/types';
import { Document } from './file';
import { Participant } from './Participant';
import { XMPP } from './XMPP';

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
  DELETED = 'deleted',
  ERROR = 'error',
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
}

export enum liveState {
  IDLE = 'idle',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  HARVESTING = 'harvesting',
  HARVESTED = 'harvested',
  ENDED = 'ended',
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

export interface PlaylistLite extends Resource {
  title?: string | Nullable<Extract<Playlist, 'title'>>;
  lti_id?: string | Nullable<Extract<Playlist, 'lti_id'>>;
}

export interface Playlist {
  consumer_site: string;
  created_by: Nullable<string>;
  duplicated_from: Nullable<string>;
  id: string;
  is_portable_to_playlist: boolean;
  is_portable_to_consumer_site: boolean;
  is_public: boolean;
  lti_id: string;
  organization: string;
  portable_to: PlaylistLite[];
  title: string;
  users: string[];
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

export interface VideoUrls {
  manifests: {
    hls: string;
  };
  mp4: Partial<urls>;
  thumbnails: Partial<urls>;
}

export enum LiveModeType {
  RAW = 'raw',
  JITSI = 'jitsi',
}

export interface LiveSession extends Resource {
  anonymous_id: Nullable<string>;
  consumer_site: Nullable<string>;
  display_name: Nullable<string>;
  email: Nullable<string>;
  id: string;
  is_registered: boolean;
  language: string;
  live_attendance: Nullable<object>;
  lti_id: Nullable<string>;
  lti_user_id: Nullable<string>;
  should_send_reminders: boolean;
  username: Nullable<string>;
  video: Video['id'];
}

/** A Video record as it exists on the backend. */
export interface Video extends Resource {
  allow_recording: boolean;
  description: string;
  is_ready_to_show: boolean;
  is_scheduled: boolean;
  has_chat: boolean;
  is_public: boolean;
  show_download: boolean;
  thumbnail: Nullable<Thumbnail>;
  timed_text_tracks: TimedText[];
  title: Nullable<string>;
  upload_state: uploadState;
  urls: Nullable<VideoUrls>;
  lti_url?: Nullable<string>;
  should_use_subtitle_as_transcript: boolean;
  starting_at: Nullable<string>;
  estimated_duration: Nullable<string>;
  has_transcript: boolean;
  participants_asking_to_join: Participant[];
  participants_in_discussion: Participant[];
  playlist: Playlist;
  live_state: Nullable<liveState>;
  live_info: {
    medialive?: {
      input: {
        endpoints: string[];
      };
    };
    jitsi?: {
      external_api_url?: string;
      domain?: string;
      config_overwrite: JitsiMeetExternalAPI.ConfigOverwriteOptions;
      interface_config_overwrite: JitsiMeetExternalAPI.InterfaceConfigOverwrtieOptions;
      room_name: string;
      token?: string;
    };
    paused_at?: string;
  };
  live_type: Nullable<LiveModeType>;
  xmpp: Nullable<XMPP>;
  is_recording?: boolean;
  recording_time?: number;
}

export interface Live extends Omit<Video, 'live_state'> {
  live_state: Exclude<liveState, liveState.ENDED>;
}

export type UploadableObject = TimedText | Video | Thumbnail | Document;
