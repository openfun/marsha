import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useSharedLiveMediaMetadata } from '.';

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

describe('useSharedLiveMediaMetadata', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
    });

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

  it('requests the shared live media metadata', async () => {
    const sharedLiveMediaMetadata = {
      name: 'document',
      description: 'Viewset for the API of the document object.',
      renders: ['application/json', 'text/html'],
      parses: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
      ],
      upload_max_size_bytes: 100,
    };
    fetchMock.mock(`/api/sharedlivemedias/`, sharedLiveMediaMetadata);

    const { result, waitFor } = renderHook(
      () => useSharedLiveMediaMetadata('fr'),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => result.current.isSuccess);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/sharedlivemedias/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'fr',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(sharedLiveMediaMetadata);
    expect(result.current.status).toEqual('success');
  });

  it('fails to get the shared live media metadata', async () => {
    fetchMock.mock(`/api/sharedlivemedias/`, 404);

    const { result, waitFor } = renderHook(
      () => useSharedLiveMediaMetadata('en'),
      {
        wrapper: Wrapper,
      },
    );

    await waitFor(() => result.current.isError);

    expect(fetchMock.lastCall()![0]).toEqual(`/api/sharedlivemedias/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'OPTIONS',
    });
    expect(result.current.data).toEqual(undefined);
    expect(result.current.status).toEqual('error');
  });
});
