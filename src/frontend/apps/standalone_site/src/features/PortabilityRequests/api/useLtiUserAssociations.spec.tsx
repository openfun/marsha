import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';
import { setLogger } from '@tanstack/react-query';

import { useCreateLtiUserAssociation } from './useLtiUserAssociations';

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
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    useJwt.getState().resetJwt();
  });

  describe('useCreateLtiUserAssociation', () => {
    it('creates the LTI user association', async () => {
      fetchMock.postOnce('/api/lti-user-associations/', 'null');

      const { result } = renderHook(() => useCreateLtiUserAssociation(), {
        wrapper: WrapperReactQuery,
      });
      result.current.mutate({
        association_jwt: 'some_association_jwt',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBeTruthy();
      });

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

      const { result } = renderHook(() => useCreateLtiUserAssociation(), {
        wrapper: WrapperReactQuery,
      });

      result.current.mutate({
        association_jwt: 'some_association_jwt',
      });

      await waitFor(() => {
        expect(result.current.isError).toBeTruthy();
      });

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
