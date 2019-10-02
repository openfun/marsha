import { Nullable } from '../utils/types';
import { Document } from './file';
import { modelName } from './models';
import { Video } from './tracks';

export enum appState {
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface AppData {
  jwt?: string;
  state: appState;
  video?: Nullable<Video>;
  document?: Nullable<Document>;
  modelName: modelName.VIDEOS | modelName.DOCUMENTS;
  sentry_dsn: Nullable<string>;
  environment: string;
  release: string;
}
