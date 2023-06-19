import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';

import ContentsFilter from './ContentsFilter';

const playlistsResponse = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 'some-playlist-id', title: 'some playlist title' },
    { id: 'an-other-playlist-id', title: 'an other title' },
  ],
};

describe('<ContentsFilter />', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  test('the render and interactions', async () => {
    const deferredPlaylists = new Deferred();
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      deferredPlaylists.promise,
    );

    let filter = {
      playlist: '',
    };
    render(
      <ContentsFilter
        filter={filter}
        setFilter={(_filter) => (filter = _filter)}
      />,
    );

    deferredPlaylists.resolve(playlistsResponse);

    expect(
      screen.queryByRole('button', { name: 'Create a new playlist' }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: /Filter/i,
      }),
    );

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Choose the playlist.',
      }),
    );

    await userEvent.click(
      await screen.findByRole('option', { name: 'an other title' }),
    );

    expect(filter.playlist).toBe('an-other-playlist-id');
  });

  test('the badge render and default filter', async () => {
    const deferredPlaylists = new Deferred();
    fetchMock.get(
      '/api/playlists/?limit=20&offset=0&ordering=-created_on&can_edit=true',
      deferredPlaylists.promise,
    );

    let filter = {
      playlist: 'my playlist',
      futurFilter: 'my futur filter',
    } as any;
    render(
      <ContentsFilter
        filter={filter}
        setFilter={(_filter) => (filter = _filter)}
      />,
    );

    deferredPlaylists.resolve(playlistsResponse);

    expect(
      screen.queryByRole('button', { name: 'Create a new playlist' }),
    ).not.toBeInTheDocument();

    expect(screen.getByText('2')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: /Filter/i,
      }),
    );

    expect(
      screen.getByLabelText('Choose the playlist., my playlist'),
    ).toBeInTheDocument();
  });
});
