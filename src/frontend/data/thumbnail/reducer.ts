import { modelName } from '../../types/models';
import { Thumbnail } from '../../types/tracks';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
} from '../genericReducers/resourceById/resourceById';
import { actionTypes } from '../rootReducer';

const initialState = { ...resourceByIdInit };

export type ThumbnailState = ResourceByIdState<Thumbnail>;

export const thumbnail = (
  state: ThumbnailState = initialState,
  action?: actionTypes,
) => {
  if (!action) {
    return state;
  }

  if (action.resourceName && action.resourceName !== modelName.THUMBNAIL) {
    return state;
  }

  return byId(state, action);
};
