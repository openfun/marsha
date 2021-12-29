import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Deferred } from '../../utils/tests/Deferred';
import {
  organizationMockFactory,
  playlistMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { OrganizationView } from '.';

jest.mock('../../data/appData', () => ({
  appData: {},
}));

describe('<OrganizationView />', () => {
  afterEach(() => fetchMock.restore());

  it('shows the list of videos and playlists for the organization', async () => {
    const queryClient = new QueryClient();
    const org = organizationMockFactory();

    const organizationDeferred = new Deferred();
    fetchMock.get(
      `/api/organizations/${org.id}/`,
      organizationDeferred.promise,
    );

    const videosDeferred = new Deferred();
    fetchMock.get(
      `/api/videos/?organization=${org.id}&limit=999`,
      videosDeferred.promise,
    );

    const playlistsDeferred = new Deferred();
    fetchMock.get(
      `/api/playlists/?organization=${org.id}&limit=999`,
      playlistsDeferred.promise,
    );

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/${org.id}`]}>
            <Routes>
              <Route path={'/:organizationId'}>
                <OrganizationView />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('heading', { name: 'Organization', level: 1 });
    screen.getByRole('heading', { name: 'Videos', level: 2 });
    screen.getByRole('status', { name: 'Loading videos...' });
    screen.getByRole('heading', { name: 'Playlists', level: 2 });
    screen.getByRole('status', { name: 'Loading playlists...' });

    await act(async () => organizationDeferred.resolve(org));

    expect(
      screen.queryByRole('heading', { name: 'Organization', level: 1 }),
    ).toBeNull();
    screen.getByRole('heading', { name: org.name, level: 1 });
    screen.getByRole('heading', { name: 'Videos', level: 2 });
    screen.getByRole('status', { name: 'Loading videos...' });
    screen.getByRole('heading', { name: 'Playlists', level: 2 });
    screen.getByRole('status', { name: 'Loading playlists...' });

    const video = videoMockFactory();
    await act(async () =>
      videosDeferred.resolve({
        count: 1,
        next: null,
        previous: null,
        results: [video],
      }),
    );

    screen.getByRole('heading', { name: 'Videos', level: 2 });
    expect(
      screen.queryByRole('status', { name: 'Loading videos...' }),
    ).toBeNull();
    expect(screen.getAllByRole('table').length).toEqual(1);
    screen.getByRole('rowheader', { name: video.title });
    screen.getByRole('heading', { name: 'Playlists', level: 2 });
    screen.getByRole('status', { name: 'Loading playlists...' });

    const playlist = playlistMockFactory();
    await act(async () =>
      playlistsDeferred.resolve({
        count: 1,
        next: null,
        previous: null,
        results: [playlist],
      }),
    );

    expect(
      screen.queryByRole('status', { name: 'Loading playlists...' }),
    ).toBeNull();
    expect(screen.getAllByRole('table').length).toEqual(2);
    screen.getByRole('rowheader', { name: playlist.title });
  });
});
