import { modelName } from '../types/models';
import { Resource } from '../types/tracks';
import { byIdActions } from './genericReducers/resourceById/resourceById';
import { currentQueryActions } from './genericReducers/resourceList/resourceList';
import { thumbnail, ThumbnailState } from './thumbnail/reducer';

import {
  timedtexttracks,
  TimedTextTracksState,
} from './timedtexttracks/reducer';
import { videos, VideosState } from './videos/reducer';

export type actionTypes<R extends Resource = Resource> =
  | byIdActions<R>
  | currentQueryActions<R>;

export interface RootState {
  resources: {
    [modelName.TIMEDTEXTTRACKS]: TimedTextTracksState;
    [modelName.THUMBNAIL]: ThumbnailState;
    [modelName.VIDEOS]: VideosState;
  };
}

export const rootReducer = (
  state: RootState | undefined,
  action: actionTypes,
) => ({
  resources: {
    [modelName.TIMEDTEXTTRACKS]: timedtexttracks(
      (state && state.resources[modelName.TIMEDTEXTTRACKS]) || undefined,
      action,
    ),
    [modelName.VIDEOS]: videos(
      (state && state.resources[modelName.VIDEOS]) || undefined,
      action,
    ),
    [modelName.THUMBNAIL]: thumbnail(
      (state && state.resources[modelName.THUMBNAIL]) || undefined,
      action,
    ),
  },
});
