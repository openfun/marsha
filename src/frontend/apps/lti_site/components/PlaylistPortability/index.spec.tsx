import { act, fireEvent, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  playlistLiteMockFactory,
  playlistMockFactory,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { Deferred, render } from 'lib-tests';
import React from 'react';

import { PlaylistPortability } from '.';

describe('<PlaylistPortability />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: true,
          },
        } as any),
    });
  });

  afterEach(() => {
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

    render(<PlaylistPortability object={video} />);

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
    fireEvent.change(input, { target: { value: otherPlaylist.id } });
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
        portable_to: currentPlaylist.portable_to
          .concat(otherPlaylist)
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

    render(<PlaylistPortability object={video} />);
    await act(async () => currentPlaylistDeferred.resolve(currentPlaylist));

    currentPlaylist.portable_to.map((playlist) => {
      screen.getByRole('listitem', {
        name: `Shared with ${playlist.title}`,
      });
    });
  });
});
