import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useCurrentUser, useJwt } from 'lib-components';
import { Deferred, render } from 'lib-tests';

import { Authenticator } from './Authenticator';

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

describe('<Authenticator />', () => {
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

    render(<Authenticator>Loggued page</Authenticator>);

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/users/whoami/'),
    );
    //  the loader is displayed
    expect(screen.getByRole('status')).toBeInTheDocument();

    useDataDeferred.resolve(whoAmIResponse200);

    expect(await screen.findByText('Loggued page')).toBeInTheDocument();
  });

  it('checks an AnonymousUser', async () => {
    useJwt.setState({
      jwt: 'some-jwt',
    });
    fetchMock.get('/api/users/whoami/', 401);

    render(<Authenticator>Loggued page</Authenticator>);

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/users/whoami/'),
    );
    //  the loader is displayed
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(useJwt.getState().jwt).toBeUndefined();
  });

  it('checks successfully the authentication with the token parameter', async () => {
    fetchMock.post('/api/auth/challenge/', {
      access: 'some-access2',
      refresh: 'some-refresh2',
    });

    fetchMock.get('/api/users/whoami/', whoAmIResponse200);

    render(<Authenticator>Loggued page</Authenticator>, {
      routerOptions: {
        history: ['/my-page/?token=123456'],
      },
    });

    expect(await screen.findByText('Loggued page')).toBeInTheDocument();
  });

  it('checks unsuccessfully the authentication with the token parameter', async () => {
    fetchMock.post('/api/auth/challenge/', 500);

    render(<Authenticator>Loggued page</Authenticator>, {
      routerOptions: {
        history: ['/my-page/?token=123456'],
      },
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

    render(<Authenticator>Loggued page</Authenticator>);

    expect(await screen.findByText('Loggued page')).toBeInTheDocument();
  });
});
