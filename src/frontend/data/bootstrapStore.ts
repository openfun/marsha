import { createStore } from 'redux';

import { AppData } from '../types/AppData';
import { modelName } from '../types/models';
import { rootReducer } from './rootReducer';

export const bootstrapStore = (appData: AppData) =>
  createStore(rootReducer, {
    context: {
      jwt: appData.jwt || null,
      ltiResourceVideo: appData.video || null,
      ltiState: appData.state,
    },
    resources: {
      [modelName.TIMEDTEXTTRACKS]: {},
      [modelName.VIDEOS]: {
        ...(appData.video
          ? { byId: { [appData.video.id]: appData.video } }
          : {}),
      },
    },
  });
