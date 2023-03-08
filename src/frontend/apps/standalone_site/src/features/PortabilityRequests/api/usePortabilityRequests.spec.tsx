import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { portabilityRequestMockFactory, useJwt } from 'lib-components';
import React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

import {
  acceptPortabilityRequest,
  rejectPortabilityRequest,
  usePortabilityRequests,
} from './usePortabilityRequests';

let Wrapper: WrapperComponent<Element>;

describe('features/PortabilityRequests/api/usePortabilityRequests', () => {
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

  describe('acceptPortabilityRequest', () => {
    it('succeeds to accept the portability request', async () => {
      const portabilityRequest = portabilityRequestMockFactory();
      fetchMock.postOnce(
        `/api/portability-requests/${portabilityRequest.id}/accept/`,
        'null',
      );

      const { result, waitFor } = renderHook(
        () => acceptPortabilityRequest(portabilityRequest.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({});
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/portability-requests/${portabilityRequest.id}/accept/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(result.current.data).toEqual(null);
      expect(result.current.status).toEqual('success');
    });

    it('fails to accept the portability request', async () => {
      const portabilityRequest = portabilityRequestMockFactory();
      fetchMock.postOnce(
        `/api/portability-requests/${portabilityRequest.id}/accept/`,
        500,
      );

      const { result, waitFor } = renderHook(
        () => acceptPortabilityRequest(portabilityRequest.id),
        {
          wrapper: Wrapper,
        },
      );

      result.current.mutate({});

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/portability-requests/${portabilityRequest.id}/accept/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('rejectPortabilityRequest', () => {
    it('succeeds to reject the portability request', async () => {
      const portabilityRequest = portabilityRequestMockFactory();
      fetchMock.postOnce(
        `/api/portability-requests/${portabilityRequest.id}/reject/`,
        'null',
      );

      const { result, waitFor } = renderHook(
        () => rejectPortabilityRequest(portabilityRequest.id),
        {
          wrapper: Wrapper,
        },
      );
      result.current.mutate({});
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/portability-requests/${portabilityRequest.id}/reject/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(result.current.data).toEqual(null);
      expect(result.current.status).toEqual('success');
    });

    it('fails to reject the portability request', async () => {
      const portabilityRequest = portabilityRequestMockFactory();
      fetchMock.postOnce(
        `/api/portability-requests/${portabilityRequest.id}/reject/`,
        500,
      );

      const { result, waitFor } = renderHook(
        () => rejectPortabilityRequest(portabilityRequest.id),
        {
          wrapper: Wrapper,
        },
      );

      result.current.mutate({});

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/portability-requests/${portabilityRequest.id}/reject/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });

  describe('usePortabilityRequests', () => {
    it('succeeds to fetch the portability requests list', async () => {
      const portabilityRequestList = [
        portabilityRequestMockFactory(),
        portabilityRequestMockFactory(),
        portabilityRequestMockFactory(),
      ];
      fetchMock.getOnce(
        '/api/portability-requests/?limit=10&offset=20&ordering=-created_on',
        portabilityRequestList,
      );

      const { result, waitFor } = renderHook(
        () =>
          usePortabilityRequests({
            offset: '20',
            limit: '10',
            ordering: '-created_on',
          }),
        {
          wrapper: Wrapper,
        },
      );
      await waitFor(() => result.current.isSuccess);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/portability-requests/?limit=10&offset=20&ordering=-created_on',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(portabilityRequestList);
      expect(result.current.status).toEqual('success');
    });

    it('fails to fetch the portability requests list', async () => {
      fetchMock.getOnce(
        '/api/portability-requests/?limit=10&offset=20&ordering=-created_on',
        500,
      );

      const { result, waitFor } = renderHook(
        () =>
          usePortabilityRequests({
            offset: '20',
            limit: '10',
            ordering: '-created_on',
          }),
        {
          wrapper: Wrapper,
        },
      );

      await waitFor(() => result.current.isError);

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/portability-requests/?limit=10&offset=20&ordering=-created_on',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});
