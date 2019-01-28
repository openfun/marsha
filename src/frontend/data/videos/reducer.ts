import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
} from '../genericReducers/resourceById/resourceById';
import { actionTypes } from '../rootReducer';

const initialState = { ...resourceByIdInit };

export type VideosState = ResourceByIdState<Video>;

export const videos = (
  state: VideosState = initialState,
  action?: actionTypes,
) => {
  if (!action) {
    return state;
  }

  if (action.resourceName && action.resourceName !== modelName.VIDEOS) {
    return state;
  }

  return byId(state, action);
};
