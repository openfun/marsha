import { render, renderHook, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { classroomMockFactory } from 'lib-classroom/tests';
import { JWT_KEY, useCurrentUser, useJwt } from 'lib-components';
import { Deferred, wrapperUtils } from 'lib-tests';

import { featureContentLoader } from 'features/Contents';

import { useAuthenticator } from './useAuthenticator';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

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
    localStorage.removeItem(JWT_KEY);
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
    expect(localStorage.getItem(JWT_KEY)).toEqual('some-access2');
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
    useJwt.setState({
      setDecodedJwt: (jwt) =>
        useJwt.setState({
          internalDecodedJwt: `${jwt!}-decoded` as any,
        }),
    });

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

    expect(useJwt.getState().withPersistancy).toEqual(true);

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
    expect(useJwt.getState().internalDecodedJwt).toEqual('valid_jwt-decoded');
    expect(localStorage.getItem(JWT_KEY)).toBeNull();
    expect(useJwt.getState().withPersistancy).toEqual(false);
    useJwt.getState().setWithPersistancy(true);
  });

  it('checks legacy invite link', async () => {
    featureContentLoader([]);
    const classroom = classroomMockFactory();
    const legacyInvite =
      'ewogICJhbGciOiAiSFMyNTYiLAogICJ0eXAiOiAiSldUIgp9.ewogICJ0b2tlbl90eXBlIjogInBsYXlsaXN0X2FjY2VzcyIsCiAgImV4cCI6IDE2ODkyMDY0MDAsCiAgImlhdCI6IDE2ODY1ODYwMzgsCiAgImp0aSI6ICJjbGFzc3Jvb20taW52aXRlLTBiY2ViMWQyLTNiMTktNDRiNy1hNjQ3LTRjMTU1NmY1OTJmZS0yMDIzLTA2LTEyIiwKICAic2Vzc2lvbl9pZCI6ICIwYmNlYjFkMi0zYjE5LTQ0YjctYTY0Ny00YzE1NTZmNTkyZmUtaW52aXRlIiwKICAicGxheWxpc3RfaWQiOiAiMGJjZWIxZDItM2IxOS00NGI3LWE2NDctNGMxNTU2ZjU5MmZlIiwKICAicm9sZXMiOiBbCiAgICAibm9uZSIKICBdLAogICJsb2NhbGUiOiAiZW5fVVMiLAogICJwZXJtaXNzaW9ucyI6IHsKICAgICJjYW5fYWNjZXNzX2Rhc2hib2FyZCI6IGZhbHNlLAogICAgImNhbl91cGRhdGUiOiBmYWxzZQogIH0sCiAgIm1haW50ZW5hbmNlIjogZmFsc2UKfQ.68xSZYUAzrLD49pLkoOQy-ud7uaJVHgZ69zgkoW7umA';
    fetchMock.get('/api/users/whoami/', whoAmIResponse200);

    expect(useJwt.getState().withPersistancy).toEqual(true);

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
    expect(useJwt.getState().withPersistancy).toEqual(false);
    useJwt.getState().setWithPersistancy(true);
  });

  it('checks error classroom invite link', async () => {
    featureContentLoader([]);

    const classroom = classroomMockFactory({
      public_token: 'foo',
    });
    fetchMock.get(
      `/api/classrooms/${classroom.id}/token/?invite_token=${classroom.public_token}`,
      {
        status: 400,
        body: {
          code: 'banned_invite_token',
          message:
            'invitation link is not valid anymore. Ask for a new invitation link to the classroom maintainer',
        },
      },
    );

    const { result } = renderHook(() => useAuthenticator(), {
      wrapper: wrapperUtils({
        routerOptions: {
          history: [
            `/my-contents/classroom/${classroom.id}/invite/${classroom.public_token}`,
          ],
        },
      }),
    });

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.isAuthenticated).toBeFalsy();
    await waitFor(() => expect(useJwt.getState().jwt).toEqual(undefined));

    render(result.current.error as any);
    expect(
      screen.getByText(
        /invitation link is not valid anymore. Ask for a new invitation link to the classroom maintainer/i,
      ),
    ).toBeInTheDocument();
  });
});
