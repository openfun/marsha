import { configureScope, init } from '@sentry/browser';

import { useSentry } from '.';

jest.mock('@sentry/browser', () => ({
  init: jest.fn(),
  configureScope: jest.fn(),
}));

const mockInit = init as jest.MockedFunction<typeof init>;
const mockConfigureScope = configureScope as jest.MockedFunction<
  typeof configureScope
>;

describe('useSentry', () => {
  it('checks isSentryReady', () => {
    expect(useSentry.getState().isSentryReady).toBeFalsy();

    useSentry
      .getState()
      .setSentry('sentry_dsn', 'environment', 'release', 'test');

    expect(mockInit).toHaveBeenCalledWith({
      dsn: 'sentry_dsn',
      environment: 'environment',
      release: 'release',
    });
    expect(mockConfigureScope).toHaveBeenCalledWith(expect.any(Function));
    expect(mockConfigureScope.mock.calls[0][0]).toEqual(expect.any(Function));
    const passedFunction = mockConfigureScope.mock.calls[0][0];
    const scope = { setExtra: jest.fn() } as any;
    passedFunction(scope);
    expect(scope.setExtra).toHaveBeenCalledWith('application', 'test');
    expect(useSentry.getState().isSentryReady).toBeTruthy();
  });
});
