import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useCurrentUser, useJwt } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { Route, Switch, useLocation } from 'react-router-dom';

import { Authenticator } from './Authenticator';

const replace = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    replace,
  },
});

const mockSWAddEventListener = jest.fn();
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    addEventListener: mockSWAddEventListener,
    removeEventListener: jest.fn(),
  },
});

const WrappedAuthenticator = () => {
  // simply wrap the Authenticator to display the location
  // for test purposes
  const location = useLocation();
  return (
    <Switch>
      <Route path="/login" exact>
        login page
      </Route>
      <Route>
        <Authenticator>
          {`${location.pathname}${location.search}`}
        </Authenticator>
      </Route>
    </Switch>
  );
};

describe('<Authenticator />', () => {
  // The state persist after unmount - this fix it
  const onUnmount = (unmount: () => void) => {
    unmount();
    useCurrentUser.setState({
      currentUser: null,
    });
  };

  beforeEach(() => {
    localStorage.removeItem('redirect_uri');
    localStorage.removeItem('jwt-storage');

    useJwt.getState().resetJwt();
    useCurrentUser.setState({
      currentUser: null,
    });
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('redirects the user on the authent page', () => {
    render(<WrappedAuthenticator />, {
      routerOptions: { history: ['/some/path/'] },
    });

    expect(screen.getByText('login page')).toBeInTheDocument();
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
      full_name: 'full name',
      id: 'id',
      is_staff: false,
      is_superuser: false,
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

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(
      screen.queryByText('/some/other/path/?some=query'),
    ).not.toBeInTheDocument();

    fetchMock.post('/api/auth/challenge/', { access: 'some-access' });

    fetchMock.get('/api/users/whoami/', {
      date_joined: 'date_joined',
      email: 'email',
      full_name: 'full name',
      id: 'id',
      is_staff: false,
      is_superuser: false,
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

    expect(
      await screen.findByText('/some/other/path/?some=query'),
    ).toBeInTheDocument();
  });

  it('redirects to login when access jwt token expired', async () => {
    const { unmount } = render(<WrappedAuthenticator />, {
      routerOptions: {
        history: ['/some/other/path/?some=query2'],
      },
    });

    expect(screen.getByText('login page')).toBeInTheDocument();

    fetchMock.post('/api/auth/challenge/', { access: 'some-access2' });

    fetchMock.get('/api/users/whoami/', {
      date_joined: 'date_joined',
      email: 'email',
      full_name: 'full name',
      id: 'id',
      is_staff: false,
      is_superuser: false,
      organization_accesses: [],
    });

    //  unmount components to mock the redirection after authentication (and init the new location)
    //  this is mandatory to take the new location.search into account
    onUnmount(unmount);
    const { unmount: unmount2 } = render(<WrappedAuthenticator />, {
      routerOptions: {
        history: ['/some/path/?token=some-token2'],
      },
    });

    expect(
      await screen.findByText('/some/other/path/?some=query2'),
    ).toBeInTheDocument();

    onUnmount(unmount2);
    const { unmount: unmount3 } = render(<WrappedAuthenticator />, {
      routerOptions: {
        history: ['/some/other/path/reconnect/'],
      },
    });

    expect(
      await screen.findByText('/some/other/path/reconnect/'),
    ).toBeInTheDocument();

    onUnmount(unmount3);

    // 401 response should kill the token
    fetchMock.get('/api/users/whoami/', 401, {
      overwriteRoutes: true,
    });

    render(<WrappedAuthenticator />, {
      routerOptions: {
        history: ['/some/other/path/re-reconnect/'],
      },
    });

    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
