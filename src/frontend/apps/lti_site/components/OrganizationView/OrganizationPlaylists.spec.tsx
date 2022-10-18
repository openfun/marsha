import { act, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { render, Deferred } from 'lib-tests';
import React from 'react';
import { QueryClient } from 'react-query';

import {
  organizationMockFactory,
  playlistMockFactory,
} from 'utils/tests/factories';

import { OrganizationPlaylists } from './OrganizationPlaylists';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({}),
}));

describe('<OrganizationPlaylists />', () => {
  jest.spyOn(console, 'error').mockImplementation(() => jest.fn());

  afterEach(() => fetchMock.restore());

  it('gets and shows the list of playlists for a given organization', async () => {
    const org = organizationMockFactory();

    const playlist1 = playlistMockFactory({ organization: org.id });
    const playlist2 = playlistMockFactory({ organization: org.id });

    const deferred = new Deferred();
    fetchMock.get(
      `/api/playlists/?limit=999&organization=${org.id}`,
      deferred.promise,
    );

    render(<OrganizationPlaylists organizationId={org.id} />);

    screen.getByRole('status', { name: 'Loading playlists...' });

    await act(async () =>
      deferred.resolve({
        count: 2,
        next: null,
        previous: null,
        results: [playlist1, playlist2],
      }),
    );

    screen.getByRole('heading', { name: 'Playlists' });
    screen.getByRole('table');
    screen.getByRole('columnheader', { name: 'Title' });
    screen.getByRole('columnheader', { name: 'LTI ID' });
    screen.getByRole('columnheader', { name: 'Consumer site' });
    screen.getByRole('rowheader', { name: playlist1.title });
    screen.getByRole('link', { name: playlist1.title });
    screen.getByRole('rowheader', { name: playlist2.title });
    screen.getByRole('link', { name: playlist2.title });
  });

  it('shows an explanatory message when the list of playlists is empty', async () => {
    const org = organizationMockFactory();

    const deferred = new Deferred();
    fetchMock.get(
      `/api/playlists/?limit=999&organization=${org.id}`,
      deferred.promise,
    );

    render(<OrganizationPlaylists organizationId={org.id} />);

    screen.getByRole('status', { name: 'Loading playlists...' });

    await act(async () =>
      deferred.resolve({
        count: 0,
        next: null,
        previous: null,
        results: [],
      }),
    );

    screen.getByRole('heading', { name: 'Playlists' });
    screen.getByRole('table');
    screen.getByText('There are no playlists for this organization yet.');
  });

  it('shows an error message when it fails to get the list of playlists for an organization', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const org = organizationMockFactory();

    const deferred = new Deferred();
    fetchMock.get(
      `/api/playlists/?limit=999&organization=${org.id}`,
      deferred.promise,
    );

    render(<OrganizationPlaylists organizationId={org.id} />, {
      queryOptions: { client: queryClient },
    });

    screen.getByRole('status', { name: 'Loading playlists...' });

    await act(async () => deferred.resolve(500));

    screen.getByRole('heading', { name: 'Playlists' });
    screen.getByRole('heading', { name: 'There was an unexpected error' });
    screen.getByText(
      'We could not access the appropriate resources. You can try reloading the page or come back again at a later time.',
    );
  });
});
