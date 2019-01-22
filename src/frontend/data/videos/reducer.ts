import { AnyAction, Reducer } from 'redux';

import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';
import { Maybe } from '../../utils/types';
import {
  ResourceAdd,
  ResourceMultipleAdd,
} from '../genericReducers/resourceById/actions';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
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
