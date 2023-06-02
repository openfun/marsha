import * as Sentry from '@sentry/browser';
import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { render } from 'lib-tests';
import React from 'react';

import AppConfig from './AppConfig';

const mockInit = jest.spyOn(Sentry, 'init').mockImplementation();
const mockConfigureScope = jest
  .spyOn(Sentry, 'configureScope')
  .mockImplementation();

describe('SentryLoader', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('should init Sentry when active', async () => {
    fetchMock.get('/api/config/', {
      environment: 'some environment',
      release: 'some release',
      sentry_dsn: 'some dsn',
    });

    render(<AppConfig />);

    expect(fetchMock.called('/api/config/')).toBe(true);
    await waitFor(() => {
      expect(mockInit).toHaveBeenCalledWith({
        dsn: 'some dsn',
        environment: 'some environment',
        release: 'some release',
      });
    });

    expect(mockConfigureScope).toHaveBeenCalledWith(expect.any(Function));
    expect(mockConfigureScope.mock.calls[0][0]).toEqual(expect.any(Function));
    const passedFunction = mockConfigureScope.mock.calls[0][0];
    const scope = { setExtra: jest.fn() } as any;
    passedFunction(scope);
    expect(scope.setExtra).toHaveBeenCalledWith('application', 'standalone');
  });

  it('should not init Sentry when not active', async () => {
    fetchMock.get(
      '/api/config/',
      {
        environment: 'some environment',
        release: 'some release',
        sentry_dsn: null,
      },
      { overwriteRoutes: true },
    );
    render(<AppConfig />);

    expect(fetchMock.called('/api/config/')).toBe(true);
    await waitFor(() => {
      expect(mockInit).not.toHaveBeenCalled();
    });

    expect(mockConfigureScope).not.toHaveBeenCalled();
  });
});
