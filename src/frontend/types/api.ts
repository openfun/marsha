import { Nullable } from '../utils/types';
import { Resource } from './tracks';

/** Possible states for any API request. */
export enum RequestStatus {
  FAILURE = 'failure',
  PENDING = 'pending',
  SUCCESS = 'success',
}

interface RespFailure {
  error: string;
  status: RequestStatus.FAILURE;
}

interface RespSuccess {
  objects: Resource[];
  status: RequestStatus.SUCCESS;
}

/** Intermediate response types to pass around in internal interfaces. */
export type Resp = RespFailure | RespSuccess;

/** Common implicit parameters (with defaults) for all API List requests. */
export interface APIListCommonRequestParams {
  limit: number;
  offset: number;
}

export interface ConsumableQuery<R extends Resource> {
  objects: R[] | never[];
  status: Nullable<RequestStatus>;
}
