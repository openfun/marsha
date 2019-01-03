import { Reducer } from 'redux';

import { appState } from '../types/AppData';
import { modelName } from '../types/models';
import { Video } from '../types/tracks';
import { Nullable } from '../utils/types';
import {
  timedtexttracks,
  TimedTextTracksState,
} from './timedtexttracks/reducer';
import { videos, VideosState } from './videos/reducer';

export interface RootState {
  context: {
    jwt: Nullable<string>;
    ltiResourceVideo: Nullable<Video>;
    ltiState: appState;
  };
  resources: {
    [modelName.TIMEDTEXTTRACKS]: TimedTextTracksState;
    [modelName.VIDEOS]: VideosState;
  };
}

export const rootReducer: Reducer<RootState> = (state, action) => ({
  context: state!.context,
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
