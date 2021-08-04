import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { PlaylistPortability } from '.';
import {
  playlistLiteMockFactory,
  playlistMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Deferred } from '../../utils/tests/Deferred';
import { wrapInRouter } from '../../utils/tests/router';
import { Grommet } from 'grommet';
import MatchMediaMock from 'jest-matchmedia-mock';
import MatchMedia from 'jest-matchmedia-mock';
import { Toaster } from 'react-hot-toast';

let matchMedia: MatchMedia;

jest.mock('../../data/appData', () => ({
  appData: {
    jwt: 'some token',
  },
  getDecodedJwt: () => ({
    permissions: {
      can_update: true,
    },
    maintenance: false,
  }),
}));

describe('<PlaylistPortability />', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });

  afterEach(() => {
    matchMedia.clear();
    fetchMock.restore();
  });

  it('adds a portability to other playlist', async () => {
    const currentPlaylist = playlistMockFactory();

    const video = videoMockFactory({
      playlist: currentPlaylist,
    });

    const otherPlaylist = playlistMockFactory();

    const updatedPlaylist = {
      ...currentPlaylist,
      portable_to: [
        {
          title: otherPlaylist.title,
          lti_id: otherPlaylist.lti_id,
        },
      ],
    };

    const currentPlaylistDeferred = new Deferred();
    fetchMock.get(
      `/api/playlists/${currentPlaylist.id}/`,
      currentPlaylistDeferred.promise,
    );

    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <Toaster />
            <QueryClientProvider client={queryClient}>
              <PlaylistPortability object={video} />
            </QueryClientProvider>
          </Grommet>,
        ),
      ),
    );

    screen.getByText('Loading playlist...');

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/playlists/${currentPlaylist.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });

    await act(async () => currentPlaylistDeferred.resolve(currentPlaylist));

    const deferredPatch = new Deferred();
    fetchMock.patch(
      `/api/playlists/${currentPlaylist.id}/`,
      deferredPatch.promise,
    );

    const input = screen.getByRole('textbox', {
      name: /share with another playlist/i,
    });
    fireEvent.change(input!, { target: { value: otherPlaylist.id } });
    fireEvent.click(screen.getByRole('button', { name: 'add share' }));

    const updatedPlaylistDeferred = new Deferred();
    fetchMock.get(
      `/api/playlists/${currentPlaylist.id}/`,
      updatedPlaylistDeferred.promise,
      { overwriteRoutes: true },
    );

    await act(async () => deferredPatch.resolve(updatedPlaylist));

    await act(async () => updatedPlaylistDeferred.resolve(updatedPlaylist));

    expect(fetchMock.calls()).toHaveLength(3);

    expect(fetchMock.calls()[1]![0]).toEqual(
      `/api/playlists/${currentPlaylist.id}/`,
    );
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        portable_to: currentPlaylist
          .portable_to!.concat(otherPlaylist)
          .map((playlist) => playlist.id),
      }),
    });

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/playlists/${currentPlaylist.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
      },
    });

    expect(fetchMock.done()).toBeTruthy();

    screen.getByRole('listitem', {
      name: `Shared with ${otherPlaylist.title}`,
    });
    expect(screen.getByRole('status')).toHaveTextContent('Playlist updated.');
  });

  it('shows current playlist portability', async () => {
    const currentPlaylist = playlistMockFactory({
      portable_to: [playlistLiteMockFactory(), playlistLiteMockFactory()],
    });

    const video = videoMockFactory({
      playlist: currentPlaylist,
    });

    const currentPlaylistDeferred = new Deferred();
    fetchMock.get(
      `/api/playlists/${currentPlaylist.id}/`,
      currentPlaylistDeferred.promise,
    );

    const queryClient = new QueryClient();
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <QueryClientProvider client={queryClient}>
              <PlaylistPortability object={video} />
            </QueryClientProvider>
          </Grommet>,
        ),
      ),
    );
    await act(async () => currentPlaylistDeferred.resolve(currentPlaylist));

    currentPlaylist.portable_to!.map((playlist) => {
      screen.getByRole('listitem', {
        name: `Shared with ${playlist.title}`,
      });
    });
  });
});
