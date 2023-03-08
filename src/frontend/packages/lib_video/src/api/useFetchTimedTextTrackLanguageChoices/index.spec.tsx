import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useFetchTimedTextTrackLanguageChoices } from '.';

setLogger({
  log: console.log,
  warn: console.warn,
  // no more errors on the console
  error: () => {},
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

let Wrapper: WrapperComponent<Element>;

describe('useFetchTimedTextTrackLanguageChoices', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = ({ children }: Element) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('requests the TimedTextTrackLanguageChoices', async () => {
    const timedTextTrackLanguageChoices = {
      name: 'Timed Text Track List',
      description: 'Viewset for the API of the TimedTextTrack object.',
      renders: ['application/json', 'text/html'],
      parses: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
      ],
    };
    fetchMock.mock(`/api/timedtexttracks/`, timedTextTrackLanguageChoices);

    const { result, waitFor } = renderHook(
      () => useFetchTimedTextTrackLanguageChoices(),
      {
        wrapper: Wrapper,
      },
    );

    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/timedtexttracks/`);

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'undefined',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(timedTextTrackLanguageChoices);

    expect(result.current.status).toEqual('success');
  });

  it('fails to get the timedtext metadata', async () => {
    fetchMock.mock(`/api/timedtexttracks/`, 404);

    const { result, waitFor } = renderHook(
      () => useFetchTimedTextTrackLanguageChoices(),
      {
        wrapper: Wrapper,
      },
    );

    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/timedtexttracks/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'undefined',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
