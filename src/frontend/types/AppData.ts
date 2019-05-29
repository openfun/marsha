import { Maybe, Nullable } from '../utils/types';
import { AWSPolicy } from './AWSPolicy';
import { Document } from './file';
import { Video } from './tracks';

export enum appState {
  ERROR = 'error',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export enum ResourceType {
  DOCUMENT = 'document',
  VIDEO = 'video',
}

export type appStateSuccess = appState.INSTRUCTOR | appState.STUDENT;

export interface AppData<R extends ResourceType> {
  jwt: string;
  state: appState;
  video: R extends ResourceType.VIDEO ? Nullable<Video> : undefined;
  document: R extends ResourceType.DOCUMENT ? Nullable<Document> : undefined;
  resourceType: R;

  updateVideo?: (video: Video) => void;
}
