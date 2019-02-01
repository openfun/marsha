import { applyMiddleware, compose, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';

import { AppData } from '../types/AppData';
import { modelName } from '../types/models';
import { initialState } from './context/reducer';
import { rootReducer } from './rootReducer';
import { rootSaga } from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

export const bootstrapStore = (appData: AppData) => {
  const composeEnhancers =
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

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
    composeEnhancers(applyMiddleware(sagaMiddleware)),
  );

  sagaMiddleware.run(rootSaga);

  return store;
};
