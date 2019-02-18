import { appState } from '../types/AppData';
import { modelName } from '../types/models';
import { Resource } from '../types/tracks';
import { context, ContextState } from './context/reducer';
import { byIdActions } from './genericReducers/resourceById/resourceById';
import { currentQueryActions } from './genericReducers/resourceList/resourceList';
import {
  timedTextTrackLanguageChoices,
  TimedTextTrackLanguageChoicesState,
} from './timedTextTrackLanguageChoices/reducer';
import {
  timedtexttracks,
  TimedTextTracksState,
} from './timedtexttracks/reducer';
import { videos, VideosState } from './videos/reducer';

export type actionTypes<R extends Resource = Resource> =
  | byIdActions<R>
  | currentQueryActions<R>;

export interface RootState<state extends appState> {
  context: ContextState<state>;
  languageChoices: TimedTextTrackLanguageChoicesState;
  resources: {
    [modelName.TIMEDTEXTTRACKS]: TimedTextTracksState;
    [modelName.VIDEOS]: VideosState;
  };
}

export const rootReducer = (
  state: RootState<appState> | undefined,
  action: actionTypes,
) => ({
  context: context(state!.context, action),
  languageChoices: timedTextTrackLanguageChoices(
    (state && state.languageChoices) || undefined,
    action,
  ),
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
