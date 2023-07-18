import { Nullable } from 'lib-common';

import { JitsiMeetExternalAPI } from '@lib-components/types/libs/JitsiMeetExternalAPI';

import { ConsumerSite } from './ConsumerSite';
import { Participant } from './Participant';
import { XMPP } from './XMPP';
import { Classroom, ClassroomDocument } from './apps/classroom/models';
import { DepositedFile } from './apps/deposit/models';
import { MarkdownDocument, MarkdownImage } from './apps/markdown/models';
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
  DELETED = 'deleted',
  INITIALIZED = 'initialized',
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

export interface Playlist extends Resource {
  consumer_site: Nullable<ConsumerSite>;
  created_by: Nullable<string>;
  duplicated_from: Nullable<string>;
  is_portable_to_playlist: boolean;
  is_portable_to_consumer_site: boolean;
  is_public: boolean;
  lti_id: string;
  organization: Nullable<{ name: string; id: string }>;
  portable_to: PlaylistLite[];
  title: string;
  retention_duration: Nullable<number>;
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

export interface SharedLiveMediaUrls {
  media?: string;
  pages: {
    [key in number]: string;
  };
}

/** A SharedLiveMedia record as it exists on the backend. */
export interface SharedLiveMedia extends Resource {
  active_stamp: Nullable<number>;
  filename: Nullable<string>;
  is_ready_to_show: boolean;
  nb_pages: Nullable<number>;
  show_download: boolean;
  title: Nullable<string>;
  upload_state: uploadState;
  urls: Nullable<SharedLiveMediaUrls>;
  video: Video['id'];
}

export type Id3SharedLiveMediaType = Resource;

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

export enum JoinMode {
  APPROVAL = 'approval',
  DENIED = 'denied',
  FORCED = 'forced',
}
export interface LiveAttendanceInfo {
  connectedInBetween?: boolean;
  fullScreen?: boolean;
  lastConnected?: number;
  muted?: boolean;
  onStage?: boolean;
  player_timer?: number;
  playing?: boolean;
  timestamp?: number;
  volume?: number;
}

export interface LiveAttendanceInfos {
  [x: number]: LiveAttendanceInfo;
}
export interface LiveAttendance extends Resource {
  display_name: Nullable<string>;
  is_registered: boolean;
  live_attendance: Nullable<LiveAttendanceInfos>;
}

export interface LiveSession extends Resource {
  anonymous_id: Nullable<string>;
  consumer_site: Nullable<string>;
  display_name: Nullable<string>;
  email: Nullable<string>;
  is_registered: boolean;
  language: string;
  live_attendance: Nullable<LiveAttendanceInfos>;
  lti_id: Nullable<string>;
  lti_user_id: Nullable<string>;
  should_send_reminders: boolean;
  username: Nullable<string>;
  video: Video['id'];
}

interface JitsiConnectionInfos {
  external_api_url: string;
  domain: string;
  config_overwrite: JitsiMeetExternalAPI.ConfigOverwriteOptions;
  interface_config_overwrite: JitsiMeetExternalAPI.InterfaceConfigOverwrtieOptions;
  token?: string;
  room_name: string;
}

export interface VideoJitsiConnectionInfos
  extends Omit<JitsiConnectionInfos, 'external_api_url' | 'domain'> {
  external_api_url?: string;
  domain?: string;
}

interface VideoMedialiveInfos {
  input: {
    endpoints: string[];
  };
}

/** A Video record as it exists on the backend. */
export interface Video extends Resource {
  active_shared_live_media: Nullable<SharedLiveMedia>;
  active_shared_live_media_page: Nullable<number>;
  allow_recording: boolean;
  can_edit: boolean;
  description: Nullable<string>;
  is_live: boolean;
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
  license: Nullable<string>;
  should_use_subtitle_as_transcript: boolean;
  starting_at: Nullable<string>;
  estimated_duration: Nullable<string>;
  has_transcript: boolean;
  participants_asking_to_join: Participant[];
  participants_in_discussion: Participant[];
  playlist: Playlist;
  join_mode: JoinMode;
  live_state: Nullable<liveState>;
  live_info: {
    medialive?: VideoMedialiveInfos;
    jitsi?: VideoJitsiConnectionInfos;
  };
  live_type: Nullable<LiveModeType>;
  xmpp: Nullable<XMPP>;
  is_recording?: boolean;
  recording_time?: number;
  shared_live_medias: SharedLiveMedia[];
}

export interface VideoStats {
  nb_views: number;
}

export interface Live extends Omit<Video, 'live_state' | 'live_type'> {
  live_state: Exclude<liveState, liveState.ENDED>;
  live_type: LiveModeType;
}

export type Id3VideoType = Pick<
  Video,
  'live_state' | 'active_shared_live_media_page'
> & {
  active_shared_live_media: Id3SharedLiveMediaType;
};

export interface LiveJitsi extends Omit<Live, 'live_type' | 'live_info'> {
  live_type: LiveModeType.JITSI;
  live_info: {
    medialive?: VideoMedialiveInfos;
    jitsi: JitsiConnectionInfos;
  };
}

export type UploadableObject =
  | TimedText
  | Video
  | Thumbnail
  | Document
  | SharedLiveMedia
  | MarkdownImage
  | DepositedFile
  | ClassroomDocument;

export type AppDataRessource =
  | Video
  | Document
  | MarkdownDocument
  | DepositedFile
  | Classroom;
