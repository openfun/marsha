import { getCurrentScope, init } from '@sentry/browser';

import { beforeSendSentry } from '@lib-components/utils';

import { useSentry } from '.';

const mockSetExtra = jest.fn();

jest.mock('@sentry/browser', () => ({
  init: jest.fn(),
  getCurrentScope: jest.fn(() => ({
    setExtra: mockSetExtra,
  })),
}));

const mockInit = init as jest.MockedFunction<typeof init>;

describe('useSentry', () => {
  it('checks isSentryReady', () => {
    expect(useSentry.getState().isSentryReady).toBeFalsy();

    useSentry
      .getState()
      .setSentry('sentry_dsn', 'environment', 'release', 'test');

    expect(mockInit).toHaveBeenCalledWith({
      beforeSend: beforeSendSentry,
      dsn: 'sentry_dsn',
      environment: 'environment',
      release: 'release',
    });
    expect(getCurrentScope().setExtra).toHaveBeenCalledWith(
      'application',
      'test',
    );
    expect(useSentry.getState().isSentryReady).toBeTruthy();
  });
});
