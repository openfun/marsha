import { Nullable } from '../utils/types';
import { Document } from './file';
import { modelName } from './models';
import { Video } from './tracks';

export enum appState {
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum flags {
  VIDEO_LIVE = 'video_live',
  SENTRY = 'sentry',
}

export interface AppData {
  jwt?: string;
  state: appState;
  video?: Nullable<Video>;
  document?: Nullable<Document>;
  modelName: modelName.VIDEOS | modelName.DOCUMENTS;
  sentry_dsn: Nullable<string>;
  environment: string;
  frontend: string;
  release: string;
  static: {
    svg: {
      icons: string;
      plyr: string;
    };
  };
  player?: string;
  flags: {
    [key in flags]?: boolean;
  };
}
