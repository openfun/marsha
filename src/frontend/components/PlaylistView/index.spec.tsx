import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter, Route } from 'react-router-dom';

import { Deferred } from '../../utils/tests/Deferred';
import {
  playlistMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { PlaylistView } from '.';

jest.mock('../../data/appData', () => ({
  appData: {},
}));

describe('<PlaylistView />', () => {
  afterEach(() => fetchMock.restore());

  it('shows the list of videos in the playlist and a form to add more', async () => {
    const queryClient = new QueryClient();
    const playlist = playlistMockFactory();

    const playlistDeferred = new Deferred();
    fetchMock.get(`/api/playlists/${playlist.id}/`, playlistDeferred.promise);

    const videosDeferred = new Deferred();
    fetchMock.get(
      `/api/videos/?playlist=${playlist.id}&limit=999`,
      videosDeferred.promise,
    );

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/${playlist.id}`]}>
            <Route path={`/:playlistId`}>
              <PlaylistView />
            </Route>
          </MemoryRouter>
        </QueryClientProvider>,
      ),
    );

    screen.getByRole('heading', { name: 'Playlist', level: 1 });
    screen.getByRole('heading', { name: 'Videos', level: 2 });
    screen.getByRole('status', { name: 'Loading videos...' });
    screen.getByRole('heading', { name: 'Add new videos', level: 2 });

    await act(async () => playlistDeferred.resolve(playlist));

    expect(
      screen.queryByRole('heading', { name: 'Playlist', level: 1 }),
    ).toBeNull();
    screen.getByRole('heading', { name: playlist.title, level: 1 });
    screen.getByRole('heading', { name: 'Videos', level: 2 });
    screen.getByRole('status', { name: 'Loading videos...' });

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
    screen.getByRole('rowheader', { name: video.title! });
  });
});
