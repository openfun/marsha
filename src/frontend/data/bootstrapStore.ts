import { applyMiddleware, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { AppData } from '../types/AppData';
import { modelName } from '../types/models';
import { initialState } from './context/reducer';
import { rootReducer } from './rootReducer';
import { rootSaga } from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

export const bootstrapStore = (appData: AppData) => {
  const store = createStore(
    rootReducer,
    {
      context: initialState,
      resources: {
        [modelName.TIMEDTEXTTRACKS]: {},
        [modelName.VIDEOS]: {
          ...(appData.video
            ? { byId: { [appData.video.id]: appData.video } }
            : {}),
        },
      },
    },
    applyMiddleware(sagaMiddleware),
  );

  sagaMiddleware.run(rootSaga);

  return store;
};
