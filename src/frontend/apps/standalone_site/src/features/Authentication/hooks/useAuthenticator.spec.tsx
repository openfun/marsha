import { renderHook } from '@testing-library/react-hooks';
import fetchMock from 'fetch-mock';
import { useCurrentUser, useJwt } from 'lib-components';
import { Deferred, wrapperUtils } from 'lib-tests';

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

    const { result, waitFor } = renderHook(() => useAuthenticator(), {
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

    const { result, waitFor } = renderHook(() => useAuthenticator(), {
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

    const { result, waitFor } = renderHook(() => useAuthenticator(), {
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

    const { waitFor } = renderHook(() => useAuthenticator(), {
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

    const { result, waitFor } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils(),
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBeTruthy());
  });

  it('checks classroom invite link', async () => {
    fetchMock.post('/api/auth/challenge/', {
      access: 'some-access2',
      refresh: 'some-refresh2',
    });

    fetchMock.get('/api/users/whoami/', whoAmIResponse200);

    const { result, waitFor } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils({
        routerOptions: {
          history: [
            '/my-contents/classroom/my-classroom-id-4321/invite/my-invite-id-1234',
          ],
        },
      }),
    });

    await waitFor(() => expect(result.current.isLoading).toBeFalsy());
    expect(result.current.isAuthenticated).toBeFalsy();
    expect(useJwt.getState().jwt).toEqual('my-invite-id-1234');
  });
});
