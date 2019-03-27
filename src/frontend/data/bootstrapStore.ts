import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { requestStatus } from '../types/api';
import { AppData } from '../types/AppData';
import { modelName } from '../types/models';
import { Nullable } from '../utils/types';
import { initialState } from './context/reducer';
import { rootReducer } from './rootReducer';
import { rootSaga } from './rootSaga';
import { ThumbnailState } from './thumbnail/reducer';
import { initialState as timedTextTrackLanguageChoicesInitialState } from './timedTextTrackLanguageChoices/reducer';
import { TimedTextTracksState } from './timedtexttracks/reducer';

const sagaMiddleware = createSagaMiddleware();

export const bootstrapStore = (appData: AppData) => {
  const composeEnhancers =
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

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

  const store = createStore(
    rootReducer,
    {
      context: initialState,
      languageChoices: timedTextTrackLanguageChoicesInitialState,
      resources: {
        [modelName.TIMEDTEXTTRACKS]: timeTextTracksState || {},
        [modelName.THUMBNAIL]: thumbnailState || {},
        [modelName.VIDEOS]: {
          ...(appData.video
            ? { byId: { [appData.video.id]: appData.video } }
            : {}),
        },
      },
    },
    composeEnhancers(applyMiddleware(sagaMiddleware)),
  );

  sagaMiddleware.run(rootSaga);

  return store;
};
