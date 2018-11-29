import { Reducer } from 'redux';

import { modelName } from '../types/models';
import { videos, VideosState } from './videos/reducer';

export interface RootState {
  resources: {
    [modelName.VIDEOS]?: VideosState;
  };
}

export const rootReducer: Reducer<RootState> = (state, action) => ({
  resources: {
    [modelName.VIDEOS]: videos(
      (state && state.resources[modelName.VIDEOS]) || undefined,
      action,
    ),
  },
});
