import { act, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { playlistMockFactory, videoMockFactory } from 'lib-components';
import { render, Deferred } from 'lib-tests';
import React from 'react';
import { Route } from 'react-router-dom';

import { PlaylistView } from '.';

jest.mock('data/stores/useAppConfig', () => ({ useAppConfig: () => ({}) }));

describe('<PlaylistView />', () => {
  afterEach(() => fetchMock.restore());

  it('shows the list of videos in the playlist and a form to add more', async () => {
    const playlist = playlistMockFactory();

    const playlistDeferred = new Deferred();
    fetchMock.get(`/api/playlists/${playlist.id}/`, playlistDeferred.promise);

    const videosDeferred = new Deferred();
    fetchMock.get(
      `/api/videos/?limit=999&playlist=${playlist.id}`,
      videosDeferred.promise,
    );

    render(
      <Route path={`/:playlistId`}>
        <PlaylistView />
      </Route>,
      { routerOptions: { componentPath: `/${playlist.id}` } },
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
