import { createSelector } from 'reselect';

import { appState } from '../../types/AppData';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { RootState } from '../rootReducer';

const timedTextTracksFilter = (state: RootState<appState>) =>
  state.resources[modelName.TIMEDTEXTTRACKS];

export const getTimedTextTracks = createSelector(
  timedTextTracksFilter,
  timedTextTracks =>
    timedTextTracks.currentQuery
      ? {
          objects: Object.values(timedTextTracks.currentQuery!.items)
            .map(key => timedTextTracks.byId[key])
            .filter(item => !!item) as TimedText[],
          status: timedTextTracks.currentQuery!.status,
        }
      : {
          objects: [],
          status: null,
        },
);
