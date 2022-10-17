/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as Sentry from '@sentry/browser';

import { useSentry } from 'data/stores/useSentry';

export const report = (error: unknown) => {
  if (useSentry.getState().isSentryReady) {
    Sentry.captureException(error);
  } else {
    // tslint:disable:no-console
    console.log(error);
  }
};
