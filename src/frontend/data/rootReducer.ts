import { Reducer } from 'redux';

import { appState } from '../types/AppData';
import { modelName } from '../types/models';
import { context, ContextState } from './context/reducer';
import {
  timedtexttracks,
  TimedTextTracksState,
} from './timedtexttracks/reducer';
import { videos, VideosState } from './videos/reducer';

export interface RootState<state extends appState> {
  context: ContextState<state>;
  resources: {
    [modelName.TIMEDTEXTTRACKS]: TimedTextTracksState;
    [modelName.VIDEOS]: VideosState;
  };
}

export const rootReducer: Reducer<RootState<appState>> = (state, action) => ({
  context: context(state!.context, action),
  resources: {
    [modelName.TIMEDTEXTTRACKS]: timedtexttracks(
      (state && state.resources[modelName.TIMEDTEXTTRACKS]) || undefined,
      action,
    ),
    [modelName.VIDEOS]: videos(
      (state && state.resources[modelName.VIDEOS]) || undefined,
      action,
    ),
  },
});
