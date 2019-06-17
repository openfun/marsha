import { createStore } from 'redux';

import { requestStatus } from '../types/api';
import { AppData } from '../types/AppData';
import { modelName } from '../types/models';
import { Nullable } from '../utils/types';
import { buildInitialState } from './context/reducer';
import { rootReducer } from './rootReducer';
import { ThumbnailState } from './thumbnail/reducer';
import { TimedTextTracksState } from './timedtexttracks/reducer';

export const bootstrapStore = (appData: AppData) => {
  let timeTextTracksState: Nullable<TimedTextTracksState> = null;
  if (appData.video && appData.video.timed_text_tracks.length > 0) {
    timeTextTracksState = appData.video.timed_text_tracks.reduce(
      (acc, item, index) => ({
        byId: {
          ...acc.byId,
          [item.id]: item,
        },
        currentQuery: {
          ...acc.currentQuery,
          items: {
            ...acc.currentQuery.items,
            [index]: item.id,
          },
        },
      }),
      {
        byId: {},
        currentQuery: {
          items: {},
          status: requestStatus.SUCCESS,
        },
      },
    );
  }
  let thumbnailState: Nullable<ThumbnailState> = null;
  if (appData.video && appData.video.thumbnail !== null) {
    thumbnailState = {
      byId: {
        [appData.video.thumbnail.id]: appData.video.thumbnail,
      },
    };
  }

  return createStore(rootReducer, {
    context: buildInitialState(appData),
    resources: {
      [modelName.TIMEDTEXTTRACKS]: timeTextTracksState || {},
      [modelName.THUMBNAIL]: thumbnailState || {},
      [modelName.VIDEOS]: {
        ...(appData.video
          ? { byId: { [appData.video.id]: appData.video } }
          : {}),
      },
    },
  });
};
