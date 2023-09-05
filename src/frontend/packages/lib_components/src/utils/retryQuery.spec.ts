import { FetchResponseError } from '@lib-components/utils/errors/exception';

import { retryQuery } from './retryQuery';

describe('retryQuery', () => {
  it('should retry on non-403 errors', () => {
    const shouldRetry = retryQuery(
      1,
      new FetchResponseError({
        status: 500,
        code: 'invalid',
        message: 'Internal error',
        response: {} as Response,
      }),
    );
    expect(shouldRetry).toBe(true);
  });

  it('should not retry on FetchResponseError 403 errors', () => {
    const shouldRetry = retryQuery(
      1,
      new FetchResponseError({
        status: 403,
        code: 'invalid',
        message: 'Unauthorized',
        response: {} as Response,
      }),
    );
    expect(shouldRetry).toBe(false);
  });

  it('should not retry on 500 errors after 3 failures', () => {
    // loop 4 times
    for (let failureCount = 0; failureCount < 4; failureCount++) {
      const shouldRetry = retryQuery(
        failureCount,
        new FetchResponseError({
          status: 500,
          code: 'invalid',
          message: 'Internal error',
          response: {} as Response,
        }),
      );
      const expectedShouldRetry = failureCount < 3;
      expect(shouldRetry).toBe(expectedShouldRetry);
    }
  });
});
