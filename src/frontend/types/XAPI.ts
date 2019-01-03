export interface DataPayload {
  context?: {
    extensions: {
      [key: string]: string | boolean | number | undefined;
    };
  };
  id?: string;
  timestamp?: string;
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

export type InitializedContextExtensionsKey =
  | 'length'
  | 'ccSubtitleEnabled'
  | 'ccSubtitleLanguage'
  | 'completionTreshold'
  | 'frameRate'
  | 'fullScreen'
  | 'quality'
  | 'screenSize'
  | 'videoPlaybackSize'
  | 'speed'
  | 'track'
  | 'userAgent'
  | 'volume';

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

export type InteractedContextExtensionsKey =
  | 'ccSubtitleEnabled'
  | 'ccSubtitleLanguage'
  | 'completionTreshold'
  | 'frameRate'
  | 'fullScreen'
  | 'quality'
  | 'videoPlaybackSize'
  | 'speed'
  | 'track'
  | 'volume';
