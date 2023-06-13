import { renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { classroomMockFactory } from 'lib-classroom';
import { useCurrentUser, useJwt } from 'lib-components';
import { Deferred, wrapperUtils } from 'lib-tests';

import { featureContentLoader } from 'features/Contents';

import { useAuthenticator } from './useAuthenticator';

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => jest.fn());

const whoAmIResponse200 = {
  date_joined: 'date_joined',
  email: 'email',
  full_name: 'full name',
  id: 'id',
  is_staff: false,
  is_superuser: false,
  organization_accesses: [],
};

describe('<useAuthenticator />', () => {
  beforeEach(() => {
    localStorage.removeItem('jwt-storage');
    useJwt.getState().resetJwt();
    useCurrentUser.setState({
      currentUser: null,
    });
  });

  afterEach(() => {
    fetchMock.restore();
    consoleError.mockClear();
    jest.resetAllMocks();
  });

  it('checks a valid jwt', async () => {
    useJwt.setState({
      jwt: 'some-jwt',
    });

    const useDataDeferred = new Deferred();
    fetchMock.get('/api/users/whoami/', useDataDeferred.promise);

    const { result } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils(),
    });

    expect(result.current.isLoading).toBeTruthy();

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/users/whoami/'),
    );

    useDataDeferred.resolve(whoAmIResponse200);

    await waitFor(() => expect(result.current.isAuthenticated).toBeTruthy());
    expect(result.current.isLoading).toBeFalsy();
    expect(useCurrentUser.getState().currentUser).toEqual(whoAmIResponse200);
    expect(useJwt.getState().internalDecodedJwt).toEqual(
      'some-internalDecodedJwt',
    );
  });

  it('checks an AnonymousUser', async () => {
    useJwt.setState({
      jwt: 'some-jwt',
      internalDecodedJwt: 'some-internalDecodedJwt 1234' as any,
    });
    fetchMock.get('/api/users/whoami/', 401);

    const { result } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils(),
    });

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/users/whoami/'),
    );

    expect(result.current.isLoading).toBeTruthy();
    await waitFor(() => expect(useJwt.getState().jwt).toBeUndefined());
    await waitFor(() =>
      expect(useJwt.getState().internalDecodedJwt).toBeUndefined(),
    );
    expect(result.current.isLoading).toBeFalsy();
  });

  it('checks successfully the authentication with the token parameter', async () => {
    fetchMock.post('/api/auth/challenge/', {
      access: 'some-access2',
      refresh: 'some-refresh2',
    });

    fetchMock.get('/api/users/whoami/', whoAmIResponse200);

    const { result } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils({
        routerOptions: {
          history: ['/my-page/?token=123456'],
        },
      }),
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBeTruthy());
    expect(useJwt.getState().internalDecodedJwt).toEqual(
      'some-internalDecodedJwt',
    );
  });

  it('checks unsuccessfully the authentication with the token parameter', async () => {
    fetchMock.post('/api/auth/challenge/', 500);

    renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils({
        routerOptions: {
          history: ['/my-page/?token=123456'],
        },
      }),
    });

    expect(fetchMock.lastCall()?.[0]).toEqual('/api/auth/challenge/');
    expect(fetchMock.lastCall()?.[1]?.body).toEqual(
      JSON.stringify({ token: '123456' }),
    );
    await waitFor(() => expect(consoleError).toHaveBeenCalled());
  });

  it('checks renders when currentUser is initialized', async () => {
    useCurrentUser.setState({
      currentUser: {
        full_name: 'John Doe',
      } as any,
    });

    const { result } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils(),
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBeTruthy());
  });

  it('checks classroom invite link', async () => {
    featureContentLoader([]);

    const accessTokenResponse = {
      access_token: 'valid_jwt',
    };
    const classroom = classroomMockFactory({
      public_token: 'foo',
    });
    fetchMock.get(
      `/api/classrooms/${classroom.id}/token/?invite_token=${classroom.public_token}`,
      accessTokenResponse,
    );

    fetchMock.get('/api/users/whoami/', whoAmIResponse200);

    const { result } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils({
        routerOptions: {
          history: [
            `/my-contents/classroom/${classroom.id}/invite/${classroom.public_token}`,
          ],
        },
      }),
    });

    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    expect(result.current.isAuthenticated).toBeFalsy();
    await waitFor(() => expect(useJwt.getState().jwt).toEqual('valid_jwt'));
  });

  it('checks legacy invite link', async () => {
    featureContentLoader([]);
    const classroom = classroomMockFactory();
    const legacyInvite =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVzb3VyY2VfYWNjZXNzIiwiZXhwIjoxNjg5MjA2NDAwLCJpYXQiOjE2ODY1ODYwMzgsImp0aSI6ImNsYXNzcm9vbS1pbnZpdGUtMGJjZWIxZDItM2IxOS00NGI3LWE2NDctNGMxNTU2ZjU5MmZlLTIwMjMtMDYtMTIiLCJzZXNzaW9uX2lkIjoiMGJjZWIxZDItM2IxOS00NGI3LWE2NDctNGMxNTU2ZjU5MmZlLWludml0ZSIsInJlc291cmNlX2lkIjoiMGJjZWIxZDItM2IxOS00NGI3LWE2NDctNGMxNTU2ZjU5MmZlIiwicm9sZXMiOlsibm9uZSJdLCJsb2NhbGUiOiJlbl9VUyIsInBlcm1pc3Npb25zIjp7ImNhbl9hY2Nlc3NfZGFzaGJvYXJkIjpmYWxzZSwiY2FuX3VwZGF0ZSI6ZmFsc2V9LCJtYWludGVuYW5jZSI6ZmFsc2V9.68xSZYUAzrLD49pLkoOQy-ud7uaJVHgZ69zgkoW7umA';
    fetchMock.get('/api/users/whoami/', whoAmIResponse200);

    const { result } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils({
        routerOptions: {
          history: [
            `/my-contents/classroom/${classroom.id}/invite/${legacyInvite}`,
          ],
        },
      }),
    });

    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    expect(result.current.isAuthenticated).toBeFalsy();
    await waitFor(() => expect(useJwt.getState().jwt).toEqual(legacyInvite));
    expect(
      fetchMock.called(
        `/api/classrooms/${classroom.id}/token/?invite_token=${legacyInvite}`,
      ),
    ).toBe(false);
  });
});
