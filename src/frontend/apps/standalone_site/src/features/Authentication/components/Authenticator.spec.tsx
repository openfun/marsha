import { render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Deferred } from 'lib-tests';
import { MemoryRouter } from 'react-router-dom';

import { Authenticator } from './Authenticator';

const replace = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    replace,
  },
});

describe('<Authenticator />', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('redirects the user on the backend authent', async () => {
    render(
      <MemoryRouter initialEntries={['/']} initialIndex={0}>
        <Authenticator>my site content</Authenticator>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        'http://localhost:8060/account/login/',
      ),
    );
    expect(screen.queryByText('my site content')).not.toBeInTheDocument();
  });

  it('authenticates the user and render the content', async () => {
    const challengeDeferred = new Deferred();
    fetchMock.post('/api/auth/challenge/', challengeDeferred.promise);

    const useDataDeferred = new Deferred();
    fetchMock.get('/api/users/whoami/', useDataDeferred.promise);

    render(
      <MemoryRouter initialEntries={['/?token=some-token']} initialIndex={0}>
        <Authenticator>my site content</Authenticator>
      </MemoryRouter>,
    );

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

    await screen.findByText('my site content');
  });
});
