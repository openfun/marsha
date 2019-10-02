import * as Sentry from '@sentry/browser';

import { appData } from '../../data/appData';

export const report = (error: Error) => {
  if (appData.sentry_dsn) {
    Sentry.captureException(error);
  } else {
    // tslint:disable:no-console
    console.log(error);
  }
};
