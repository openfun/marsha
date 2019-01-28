import { Resource } from '../../../types/tracks';
import { Maybe } from '../../../utils/types';
import { actionTypes } from '../../rootReducer';
import { ResourceAdd, ResourceDelete, ResourceMultipleAdd } from './actions';

export const initialState = {
  byId: {},
};

export interface ResourceByIdState<R extends Resource> {
  byId: {
    [id: string]: Maybe<R>;
  };
}

export type byIdActions<R extends Resource> =
  | ResourceAdd<R>
  | ResourceDelete<R>
  | ResourceMultipleAdd<R>;

export function byId<R extends Resource, S extends ResourceByIdState<R>>(
  state: S,
  action: actionTypes<R>,
): S {
  switch (action.type) {
    // Add a single record to our state
    case 'RESOURCE_ADD':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.resource.id]: action.resource,
        },
      };

    case 'RESOURCE_DELETE':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.resource.id]: undefined,
        },
      };

    // Add many records at once (for better performance than many RESOURCE_ADD)
    case 'RESOURCE_MULTIPLE_ADD':
      return {
        ...state,
        byId: {
          ...state.byId,
          ...action.resources.reduce(
            (acc, resource) => ({ ...acc, [resource.id]: resource }),
            {},
          ),
        },
      };
  }

  return state;
}
