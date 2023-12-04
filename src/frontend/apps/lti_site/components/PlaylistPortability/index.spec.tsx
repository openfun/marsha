import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import {
  playlistLiteMockFactory,
  playlistMockFactory,
  videoMockFactory,
} from 'lib-components/tests';
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
        }) as any,
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

    screen.getByLabelText('Loading playlist...');

    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/playlists/${currentPlaylist.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
    });

    act(() => currentPlaylistDeferred.resolve(currentPlaylist));

    const deferredPatch = new Deferred();
    fetchMock.patch(
      `/api/playlists/${currentPlaylist.id}/`,
      deferredPatch.promise,
    );

    const input = await screen.findByRole('textbox', {
      name: /Paste playlist id/i,
    });
    fireEvent.change(input, { target: { value: otherPlaylist.id } });
    fireEvent.click(screen.getByRole('button', { name: 'add share' }));

    const updatedPlaylistDeferred = new Deferred();
    fetchMock.get(
      `/api/playlists/${currentPlaylist.id}/`,
      updatedPlaylistDeferred.promise,
      { overwriteRoutes: true },
    );

    act(() => deferredPatch.resolve(updatedPlaylist));

    act(() => updatedPlaylistDeferred.resolve(updatedPlaylist));

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(3));

    expect(fetchMock.calls()[1]![0]).toEqual(
      `/api/playlists/${currentPlaylist.id}/`,
    );
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        Authorization: 'Bearer some token',
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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
        'Accept-Language': 'en',
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
    act(() => currentPlaylistDeferred.resolve(currentPlaylist));

    for (const playlist of currentPlaylist.portable_to) {
      expect(
        await screen.findByRole('listitem', {
          name: `Shared with ${playlist.title!}`,
        }),
      ).toBeInTheDocument();
    }
  });
});
