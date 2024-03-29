import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { WrapperReactQuery } from 'lib-tests';

import { useCreateLtiUserAssociation } from '.';

describe('features/PortabilityRequests/api/useLtiUserAssociations', () => {
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
          'Accept-Language': 'en',
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
          'Accept-Language': 'en',
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
