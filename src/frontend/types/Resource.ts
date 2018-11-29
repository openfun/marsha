import { Maybe } from '../utils/types';

export interface ResourceByIdState<R extends Resource> {
  byId: {
    [id: string]: Maybe<R>;
  };
}

export interface Resource {
  id: number | string;
}
