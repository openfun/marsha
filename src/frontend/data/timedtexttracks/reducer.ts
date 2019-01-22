import { AnyAction, Reducer } from 'redux';

import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
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

export type TimedTextTracksState = Maybe<ResourceByIdState<TimedText>>;

export const timedtexttracks: Reducer<TimedTextTracksState> = (
  state: TimedTextTracksState = initialState,
  action?: ResourceAdd<TimedText> | ResourceMultipleAdd<TimedText> | AnyAction,
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

  return byId(state, action);
};
