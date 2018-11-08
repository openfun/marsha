import { Nullable } from '../utils/types';
import { AWSPolicy } from './AWSPolicy';
import { Video } from './Video';

export interface AppData {
  jwt: string;
  policy?: AWSPolicy;
  resourceLinkid: string;
  state: 'error' | 'instructor' | 'student';
  video: Nullable<Video>;

  updateVideo?: (video: Video) => void;
}
