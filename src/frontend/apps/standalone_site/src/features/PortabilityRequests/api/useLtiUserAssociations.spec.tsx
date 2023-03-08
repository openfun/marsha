import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import { useCreateLtiUserAssociation } from './useLtiUserAssociations';

let Wrapper: WrapperComponent<Element>;

describe('features/PortabilityRequests/api/useLtiUserAssociations', () => {
  beforeAll(() => {
    setLogger({
      log: console.log,
      warn: console.warn,
      // disable the "invalid json response body" error when testing failure
      error: jest.fn(),
    });
  });

  beforeEach(() => {
    useJwt.getState().setJwt('some token');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = function Wrapper({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    useJwt.getState().resetJwt();
  });

  describe('useCreateLtiUserAssociation', () => {
    it('creates the LTI user association', async () => {
      fetchMock.postOnce('/api/lti-user-associations/', 'null');

      const { result, waitFor } = renderHook(
        () => useCreateLtiUserAssociation(),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({
        association_jwt: 'some_association_jwt',
      });
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(`/api/lti-user-associations/`);
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          association_jwt: 'some_association_jwt',
        }),
      });
      expect(result.current.data).toEqual(null);
      expect(result.current.status).toEqual('success');
    });

    it('fails to create the LTI user association', async () => {
      fetchMock.postOnce('/api/lti-user-associations/', 500);

      const { result, waitFor } = renderHook(
        () => useCreateLtiUserAssociation(),
        {
          wrapper: Wrapper,
        },
      );

      result.current.mutate({
        association_jwt: 'some_association_jwt',
      });

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual('/api/lti-user-associations/');
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          association_jwt: 'some_association_jwt',
        }),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});
