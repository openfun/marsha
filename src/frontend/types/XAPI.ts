export interface DataPayload {
  context?: {
    extensions: {
      [key: string]: string | boolean | number | undefined;
    };
  };
  result?: {
    extensions: {
      [key: string]: string | boolean | number | undefined;
    };
  };
  verb: {
    id: string;
    display: {
      [key: string]: string;
    };
  };
}

export interface CompletedDataPlayload extends DataPayload {
  result?: {
    extensions: {
      [key: string]: string | boolean | number | undefined;
    };
    completion: boolean;
    duration: string;
  };
}

export enum ContextExtensionsDefintion {
  ccSubtitleEnabled = 'https://w3id.org/xapi/video/extensions/cc-subtitle-enabled',
  ccSubtitleLanguage = 'https://w3id.org/xapi/video/extensions/cc-subtitle-lang',
  completionTreshold = 'https://w3id.org/xapi/video/extensions/completion-threshold',
  frameRate = 'https://w3id.org/xapi/video/extensions/frame-rate',
  fullScreen = 'https://w3id.org/xapi/video/extensions/full-screen',
  length = 'https://w3id.org/xapi/video/extensions/length',
  quality = 'https://w3id.org/xapi/video/extensions/quality',
  screenSize = 'https://w3id.org/xapi/video/extensions/screen-size',
  sessionId = 'https://w3id.org/xapi/video/extensions/session-id',
  speed = 'https://w3id.org/xapi/video/extensions/speed',
  track = 'https://w3id.org/xapi/video/extensions/track',
  userAgent = 'https://w3id.org/xapi/video/extensions/user-agent',
  videoPlaybackSize = 'https://w3id.org/xapi/video/extensions/video-playback-size',
  volume = 'https://w3id.org/xapi/video/extensions/volume',
}

export enum ResultExtensionsDefinition {
  playedSegment = 'https://w3id.org/xapi/video/extensions/played-segments',
  progress = 'https://w3id.org/xapi/video/extensions/progress',
  time = 'https://w3id.org/xapi/video/extensions/time',
  timeFrom = 'https://w3id.org/xapi/video/extensions/time-from',
  timeTo = 'https://w3id.org/xapi/video/extensions/time-to',
}

export enum VerbDefinition {
  completed = 'http://adlnet.gov/expapi/verbs/completed',
  initialized = 'http://adlnet.gov/expapi/verbs/initialized',
  interacted = 'http://adlnet.gov/expapi/verbs/interacted',
  paused = 'https://w3id.org/xapi/video/verbs/paused',
  played = 'https://w3id.org/xapi/video/verbs/played',
  seeked = 'https://w3id.org/xapi/video/verbs/seeked',
  terminated = 'http://adlnet.gov/expapi/verbs/terminated',
}

/************* Played event  *************/
export interface PlayedResultExtensions {
  time: number;
}

/************* Initialized event **********/
export interface InitializedContextExtensions {
  length: number;
  ccSubtitleEnabled?: boolean;
  ccSubtitleLanguage?: string;
  completionTreshold?: number;
  frameRate?: number;
  fullScreen?: boolean;
  quality?: string;
  screenSize?: string;
  videoPlaybackSize?: string;
  speed?: string;
  track?: string;
  userAgent?: string;
  volume?: number;
}

/************* Paused event  **************/

export interface PausedContextExtensions {
  completionTreshold?: number;
}

export interface PausedResultExtensions {
  time: number;
}

/************* Seeked event  ***************/

export interface SeekedResultExtensions {
  timeFrom: number;
  timeTo: number;
}

/************* Completed event  *************/

export interface CompletedContextExtensions {
  completionTreshold?: number;
}

/************* Terminated event  *************/

export interface TerminatedContextExtensions {
  completionTreshold?: number;
}

export interface TerminatedResultExtensions {
  time: number;
}

/************* Interacted event  *************/

export interface InteractedContextExtensions {
  ccSubtitleEnabled?: boolean;
  ccSubtitleLanguage?: string;
  completionTreshold?: number;
  frameRate?: number;
  fullScreen?: boolean;
  quality?: string;
  videoPlaybackSize?: string;
  speed?: string;
  track?: string;
  volume?: number;
}
