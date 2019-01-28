import { API_LIST_DEFAULT_PARAMS } from '../../../settings';
import { APIListCommonRequestParams, requestStatus } from '../../../types/api';
import { Resource } from '../../../types/tracks';
import { Maybe } from '../../../utils/types';
import { actionTypes } from '../../rootReducer';
import {
  ResourceListGet,
  ResourceListGetFailure,
  ResourceListGetSuccess,
} from './actions';

const { FAILURE, PENDING, SUCCESS } = requestStatus;

export const initialState = {};

export type ResourceListStateParams = APIListCommonRequestParams & {
  [key: string]: Maybe<string | number | Array<string | number>>;
};

export interface ResourceListState<R extends Resource> {
  currentQuery?: {
    // A number-keyed object is more stable than an array to keep a list with a moving starting
    // index and potential gaps throughout.
    // NB: we still use string as the index type as keys of an objects are always converted to strings
    items: { [index: string]: R['id'] };
    params?: ResourceListStateParams;
    status: requestStatus;
  };
}

export type currentQueryActions<R extends Resource> =
  | ResourceListGet
  | ResourceListGetFailure
  | ResourceListGetSuccess<R>;

export function currentQuery<
  R extends Resource,
  S extends ResourceListState<R>
>(state: S, action: actionTypes<R>): S {
  switch (action.type) {
    // Use a `{}` block to isolate limit/offset/restParams scope
    case 'RESOURCE_LIST_GET': {
      // Get the limit/offset from our params, set our defaults
      const {
        limit = API_LIST_DEFAULT_PARAMS.limit,
        offset = API_LIST_DEFAULT_PARAMS.offset,
        ...restParams
      } = action.params;

      return {
        ...state,
        currentQuery: {
          items: {},
          params: { ...restParams, limit, offset },
          status: PENDING,
        },
      };
    }

    case 'RESOURCE_LIST_GET_FAILURE':
      return {
        ...state,
        currentQuery: {
          ...state.currentQuery,
          items: {},
          status: FAILURE,
        },
      };

    // Use a `{}` block to isolate limit/offset/restParams scope
    case 'RESOURCE_LIST_GET_SUCCESS': {
      const { objects } = action.apiResponse;
      // Get the limit/offset from our params, set our defaults
      const {
        limit = API_LIST_DEFAULT_PARAMS.limit,
        offset = API_LIST_DEFAULT_PARAMS.offset,
        ...restParams
      } = action.params;

      return {
        ...state,
        currentQuery: {
          items: objects.reduce(
            // Transform the array into an object with indexes as keys
            (acc, item, index) => ({ ...acc, [offset + index]: item.id }),
            {},
          ),
          // Copy back the params, now with proper defaults on limit/offset
          params: { ...restParams, limit, offset },
          status: SUCCESS,
        },
      };
    }
  }

  return state;
}
