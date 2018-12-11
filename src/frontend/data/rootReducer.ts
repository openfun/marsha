import { Reducer } from 'redux';

import { appState } from '../types/AppData';
import { modelName } from '../types/models';
import { Video } from '../types/tracks';
import { Nullable } from '../utils/types';
import { videos, VideosState } from './videos/reducer';

export interface RootState {
  context: {
    jwt: Nullable<string>;
    ltiResourceVideo: Nullable<Video>;
    ltiState: appState;
  };
  resources: {
    [modelName.VIDEOS]: VideosState;
  };
}

export const rootReducer: Reducer<RootState> = (state, action) => ({
  context: state!.context,
  resources: {
    [modelName.VIDEOS]: videos(
      (state && state.resources[modelName.VIDEOS]) || undefined,
      action,
    ),
  },
});
