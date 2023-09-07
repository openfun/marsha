import { ErrorEvent, EventHint } from '@sentry/types/types/event';

export const beforeSendSentry = (event: ErrorEvent, hint: EventHint) => {
  const error = hint.originalException;
  if (error instanceof TypeError && error.message === 'Load failed') {
    return null;
  }
  return event;
};
