export type contextExtensionsKey =
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
