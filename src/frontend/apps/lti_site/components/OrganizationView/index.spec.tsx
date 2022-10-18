import { act, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  organizationMockFactory,
  playlistMockFactory,
  videoMockFactory,
} from 'lib-components';
import { render, Deferred } from 'lib-tests';
import React from 'react';
import { Route } from 'react-router-dom';

import { OrganizationView } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({}),
}));

describe('<OrganizationView />', () => {
  afterEach(() => fetchMock.restore());

  it('shows the list of videos and playlists for the organization', async () => {
    const org = organizationMockFactory();

    const organizationDeferred = new Deferred();
    fetchMock.get(
      `/api/organizations/${org.id}/`,
      organizationDeferred.promise,
    );

    const videosDeferred = new Deferred();
    fetchMock.get(
      `/api/videos/?limit=999&organization=${org.id}`,
      videosDeferred.promise,
    );

    const playlistsDeferred = new Deferred();
    fetchMock.get(
      `/api/playlists/?limit=999&organization=${org.id}`,
      playlistsDeferred.promise,
    );

    render(
      <Route path={'/:organizationId'}>
        <OrganizationView />
      </Route>,
      { routerOptions: { componentPath: `/${org.id}` } },
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
    screen.getByRole('rowheader', { name: video.title! });
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
