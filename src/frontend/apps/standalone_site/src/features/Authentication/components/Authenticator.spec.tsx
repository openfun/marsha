import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useCurrentUser, useJwt } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { useLocation } from 'react-router-dom';

import { Authenticator } from './Authenticator';

const replace = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    replace,
  },
});

const WrappedAuthenticator = () => {
  // simply wrap the Authenticator to display the location
  // for test purposes
  const location = useLocation();
  return (
    <Authenticator>{`${location.pathname}${location.search}`}</Authenticator>
  );
};

describe('<Authenticator />', () => {
  beforeEach(() => {
    localStorage.removeItem('redirect_uri');

    useJwt.setState({
      jwt: undefined,
    });
    useCurrentUser.setState({
      currentUser: null,
    });
    fetchMock.restore();
  });

  it('redirects the user on the backend authent', async () => {
    render(<WrappedAuthenticator />, {
      routerOptions: { history: ['/some/path/'] },
    });

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        'http://localhost:8060/account/login/',
      ),
    );
    expect(screen.queryByText('/some/path/')).not.toBeInTheDocument();
  });

  it('authenticates the user and render the content', async () => {
    const challengeDeferred = new Deferred();
    fetchMock.post('/api/auth/challenge/', challengeDeferred.promise);

    const useDataDeferred = new Deferred();
    fetchMock.get('/api/users/whoami/', useDataDeferred.promise);

    render(<WrappedAuthenticator />, {
      routerOptions: {
        history: ['/some/path/?token=some-token'],
      },
    });

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/auth/challenge/'),
    );
    //  the loader is displayed
    expect(screen.getByRole('status')).toBeInTheDocument();

    //  resolve challenge
    challengeDeferred.resolve({ access: 'some-access' });

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/users/whoami/'),
    );
    //  the loader is still displayed
    expect(screen.getByRole('status')).toBeInTheDocument();

    useDataDeferred.resolve({
      date_joined: 'date_joined',
      email: 'email',
      first_name: 'first_name',
      id: 'id',
      is_staff: false,
      is_superuser: false,
      last_name: 'last_name',
      organization_accesses: [],
    });

    await screen.findByText('/some/path/');
  });

  it('authenticates the user and render the initially requested URL', async () => {
    // populate the local storage with the initially requested URL
    const { unmount } = render(<WrappedAuthenticator />, {
      routerOptions: {
        history: ['/some/other/path/?some=query'],
      },
    });

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        'http://localhost:8060/account/login/',
      ),
    );
    expect(
      screen.queryByText('/some/other/path/?some=query'),
    ).not.toBeInTheDocument();

    fetchMock.post('/api/auth/challenge/', { access: 'some-access' });

    fetchMock.get('/api/users/whoami/', {
      date_joined: 'date_joined',
      email: 'email',
      first_name: 'first_name',
      id: 'id',
      is_staff: false,
      is_superuser: false,
      last_name: 'last_name',
      organization_accesses: [],
    });

    //  unmount components to mock the redirection after authentication (and init the new location)
    //  this is mandatory to take the new location.search into account
    unmount();
    render(<WrappedAuthenticator />, {
      routerOptions: {
        history: ['/some/path/?token=some-token'],
      },
    });

    await waitFor(() => {
      expect(
        screen.getByText('/some/other/path/?some=query'),
      ).toBeInTheDocument();
    });
  });
});
