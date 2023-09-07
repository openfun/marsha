import { ErrorEvent } from '@sentry/types/types/event';

import { beforeSendSentry } from './beforeSendSentry';

describe('beforeSendSentry', () => {
  it('should return null if error is TypeError "Load failed"', () => {
    const error = new TypeError('Load failed');
    const hint = { originalException: error };
    const errorEvent = {};

    const result = beforeSendSentry(errorEvent as ErrorEvent, hint);

    expect(result).toBeNull();
  });

  it('should return event if error is not TypeError "Load failed"', () => {
    const error = new Error('Other error');
    const hint = { originalException: error };
    const event = {};

    const result = beforeSendSentry(event as ErrorEvent, hint);

    expect(result).toBe(event);
  });
});
