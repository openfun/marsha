import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Playlist } from 'lib-components';
import { Deferred, render } from 'lib-tests';

import { UpdatePlaylistPage } from './UpdatePlaylistPage';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    id: 'some-id',
  }),
}));

describe('<UpdatePlaylistPage />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders main infos and playlist access', async () => {
    const deferred = new Deferred<Playlist>();
    fetchMock.mock('/api/playlists/some-id/', deferred.promise);
    fetchMock.mock('/api/organizations/?limit=20&offset=0', {
      count: 2,
      results: [
        { id: 'id orga', name: 'first orga' },
        { id: 'second id', name: 'second organization' },
      ],
    });
    fetchMock.mock(
      '/api/playlist-accesses/?limit=20&playlist_id=some-id&offset=0',
      {
        count: 0,
        results: [],
      },
    );

    render(<UpdatePlaylistPage />);

    expect(await screen.findByRole('status')).toBeInTheDocument();

    const playlist = {
      id: 'some-id',
      consumer_site: null,
      created_by: null,
      duplicated_from: null,
      is_portable_to_playlist: false,
      is_portable_to_consumer_site: false,
      is_public: true,
      lti_id: 'lti id',
      organization: { name: 'my orga', id: 'id orga' },
      portable_to: [],
      title: 'playlist title',
      users: [],
    };
    deferred.resolve(playlist);

    expect(
      await screen.findByRole('heading', { name: 'Main informations' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open Drop; Selected: id orga' }),
    ).not.toBeDisabled();
    expect(screen.getByDisplayValue('playlist title')).not.toBeDisabled();

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Playlist access' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add people' }),
    ).toBeInTheDocument();

    const deferredUpdate = new Deferred<Playlist>();
    fetchMock.mock('/api/playlists/some-id/', deferredUpdate.promise, {
      method: 'PATCH',
      overwriteRoutes: true,
    });

    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Open Drop; Selected: id orga' }),
      ).toBeDisabled(),
    );

    fetchMock.mock('/api/playlists/some-id/', playlist, {
      overwriteRoutes: true,
    });
    deferredUpdate.resolve(playlist);

    expect(
      await screen.findByText('Playlist updated with success.'),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Open Drop; Selected: id orga' }),
      ).not.toBeDisabled(),
    );
  });
});
