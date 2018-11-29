import { AnyAction, Reducer } from 'redux';

import { modelName } from '../../types/models';
import { ResourceByIdState } from '../../types/Resource';
import { Video } from '../../types/Video';
import { Maybe } from '../../utils/types';
import {
  ResourceAdd,
  ResourceMultipleAdd,
} from '../genericReducers/resourceById/actions';
import {
  byId,
  initialState as resourceByIdInit,
} from '../genericReducers/resourceById/resourceById';

const initialState = { ...resourceByIdInit };

export type VideosState = Maybe<ResourceByIdState<Video>>;

export const videos: Reducer<VideosState> = (
  state: VideosState = initialState,
  action?: ResourceAdd<Video> | ResourceMultipleAdd<Video> | AnyAction,
) => {
  if (!action) {
    return state;
  }

  if (action.resourceName && action.resourceName !== modelName.VIDEOS) {
    return state;
  }

  return byId(state, action);
};
