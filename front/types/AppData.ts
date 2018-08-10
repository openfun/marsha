import { AWSPolicy } from './AWSPolicy';

export interface AppData {
  jwt: string;
  policy?: AWSPolicy;
  resourceLinkid: string;
  state: string;
}
