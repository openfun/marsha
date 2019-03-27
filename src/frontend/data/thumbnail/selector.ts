import { createSelector } from 'reselect';

import { appState } from '../../types/AppData';
import { modelName } from '../../types/models';
import { RootState } from '../rootReducer';

const thumbnailFilter = (state: RootState<appState>) =>
  state.resources[modelName.THUMBNAIL];

export const getThumbnail = createSelector(
  thumbnailFilter,
  thumbnail => {
    if (thumbnail && thumbnail.byId) {
      const thumbnailId = Object.keys(thumbnail.byId).shift();
      return thumbnail.byId[thumbnailId!]!;
    }

    return null;
  },
);
