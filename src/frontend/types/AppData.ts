import { Nullable } from '../utils/types';
import { AWSPolicy } from './AWSPolicy';
import { Video } from './tracks';

export enum appState {
  ERROR = 'error',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export type appStateSuccess = appState.INSTRUCTOR | appState.STUDENT;

export interface AppData {
  jwt: string;
  policy?: AWSPolicy;
  resourceLinkid: string;
  state: appState;
  video: Nullable<Video>;
}
