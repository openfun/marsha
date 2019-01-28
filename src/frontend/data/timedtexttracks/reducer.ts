import { modelName } from '../../types/models';
import { Resource, TimedText } from '../../types/tracks';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
} from '../genericReducers/resourceById/resourceById';
import {
  currentQuery,
  ResourceListState,
} from '../genericReducers/resourceList/resourceList';
import { actionTypes } from '../rootReducer';

const initialState = { ...resourceByIdInit };

export type TimedTextTracksState = ResourceByIdState<TimedText> &
  ResourceListState<TimedText>;

export const timedtexttracks = (
  state: TimedTextTracksState = initialState,
  action?: actionTypes<Resource>,
) => {
  if (!action) {
    return state;
  }

  if (
    action.resourceName &&
    action.resourceName !== modelName.TIMEDTEXTTRACKS
  ) {
    return state;
  }

  return currentQuery(byId(state, action), action);
};
