import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { portabilityRequestMockFactory } from 'lib-components/tests';
import { WrapperReactQuery } from 'lib-tests';

import {
  acceptPortabilityRequest,
  rejectPortabilityRequest,
  usePortabilityRequests,
} from './usePortabilityRequests';

describe('features/PortabilityRequests/api/usePortabilityRequests', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
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

      const { result } = renderHook(
        () => acceptPortabilityRequest(portabilityRequest.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({});
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/portability-requests/${portabilityRequest.id}/accept/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () => acceptPortabilityRequest(portabilityRequest.id),
        {
          wrapper: WrapperReactQuery,
        },
      );

      result.current.mutate({});

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/portability-requests/${portabilityRequest.id}/accept/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () => rejectPortabilityRequest(portabilityRequest.id),
        {
          wrapper: WrapperReactQuery,
        },
      );
      result.current.mutate({});
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/portability-requests/${portabilityRequest.id}/reject/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () => rejectPortabilityRequest(portabilityRequest.id),
        {
          wrapper: WrapperReactQuery,
        },
      );

      result.current.mutate({});

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        `/api/portability-requests/${portabilityRequest.id}/reject/`,
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () =>
          usePortabilityRequests({
            offset: '20',
            limit: '10',
            ordering: '-created_on',
          }),
        {
          wrapper: WrapperReactQuery,
        },
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/portability-requests/?limit=10&offset=20&ordering=-created_on',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
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

      const { result } = renderHook(
        () =>
          usePortabilityRequests({
            offset: '20',
            limit: '10',
            ordering: '-created_on',
          }),
        {
          wrapper: WrapperReactQuery,
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

      expect(fetchMock.lastCall()![0]).toEqual(
        '/api/portability-requests/?limit=10&offset=20&ordering=-created_on',
      );
      expect(fetchMock.lastCall()![1]).toEqual({
        headers: {
          Authorization: 'Bearer some token',
          'Content-Type': 'application/json',
          'Accept-Language': 'en',
        },
      });
      expect(result.current.data).toEqual(undefined);
      expect(result.current.status).toEqual('error');
    });
  });
});
