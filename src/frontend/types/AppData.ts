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
  JITSI = 'jitsi',
}

export interface AppData {
  jwt?: string;
  state: appState;
  video?: Nullable<Video>;
  videos?: Video[];
  document?: Nullable<Document>;
  documents?: Document[];
  modelName: modelName.VIDEOS | modelName.DOCUMENTS;
  new_document_url?: string;
  new_video_url?: string;
  lti_select_form_action_url?: string;
  lti_select_form_data?: {
    [key: string]: string;
  };
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
  flags?: {
    [key in flags]?: boolean;
  };
}
