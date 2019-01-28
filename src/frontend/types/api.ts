import { Nullable } from '../utils/types';
import { Resource } from './tracks';

/** Possible states for any API request. */
export enum requestStatus {
  FAILURE = 'failure',
  PENDING = 'pending',
  SUCCESS = 'success',
}

/** Common implicit parameters (with defaults) for all API List requests. */
export interface APIListCommonRequestParams {
  limit: number;
  offset: number;
}

export interface ConsumableQuery<R extends Resource> {
  objects: R[] | never[];
  status: Nullable<requestStatus>;
}
