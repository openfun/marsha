import * as Sentry from '@sentry/browser';

import { useSentry } from 'data/stores/useSentry';

export const report = (error: unknown) => {
  if (useSentry.getState().isSentryReady) {
    Sentry.captureException(error);
  } else {
    console.log(error);
  }
};
