import { Nullable } from '../utils/types';
import { Document } from './file';
import { modelName } from './models';
import { Video } from './tracks';

export enum appState {
  ERROR = 'error',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export interface AppData {
  jwt: string;
  state: appState;
  video?: Nullable<Video>;
  document?: Nullable<Document>;
  modelName: modelName;
}
