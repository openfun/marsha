import { Nullable } from '../utils/types';
import { Document } from './file';
import { ModelName } from './models';
import { Video } from './tracks';

export enum AppState {
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum Flags {
  VIDEO_LIVE = 'video_live',
}

export interface AppData {
  jwt?: string;
  state: AppState;
  video?: Nullable<Video>;
  document?: Nullable<Document>;
  modelName: ModelName.VIDEOS | ModelName.DOCUMENTS;
  sentry_dsn: Nullable<string>;
  environment: string;
  frontend: string;
  release: string;
  static: {
    svg: {
      plyr: string;
    };
  };
  player?: string;
  flags: {
    [key in Flags]?: boolean;
  };
}
