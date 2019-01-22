import { createStore } from 'redux';

import { AppData } from '../types/AppData';
import { modelName } from '../types/models';
import { initialState } from './context/reducer';
import { rootReducer } from './rootReducer';

export const bootstrapStore = (appData: AppData) =>
  createStore(rootReducer, {
    context: initialState,
    resources: {
      [modelName.TIMEDTEXTTRACKS]: {},
      [modelName.VIDEOS]: {
        ...(appData.video
          ? { byId: { [appData.video.id]: appData.video } }
          : {}),
      },
    },
  });
