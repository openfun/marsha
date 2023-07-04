import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Playlist } from 'lib-components';
import { Deferred, render } from 'lib-tests';

import { featureContentLoader } from 'features/Contents';

import { UpdatePlaylistPage } from './UpdatePlaylistPage';

const deferredPlaylist = new Deferred<Playlist>();
const playlist = {
  id: 'some-id',
  retention_duration: 365,
  consumer_site: null,
  created_by: null,
  created_on: '2021-03-18T14:00:00Z',
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

describe('<UpdatePlaylistPage />', () => {
  beforeEach(() => {
    fetchMock.mock('/api/playlists/some-id/', deferredPlaylist.promise);
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
    fetchMock.mock(
      '/api/videos/?limit=4&offset=0&ordering=-created_on&is_live=true&playlist=some-id',
      {
        count: 0,
        results: [],
      },
    );
    fetchMock.mock(
      '/api/videos/?limit=4&offset=0&ordering=-created_on&is_live=false&playlist=some-id',
      {
        count: 0,
        results: [],
      },
    );
    fetchMock.mock('/api/classrooms/?limit=4&offset=0&playlist=some-id', {
      count: 0,
      results: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders main infos and playlist access', async () => {
    render(<UpdatePlaylistPage playlistId="some-id" />);

    expect(await screen.findByRole('status')).toBeInTheDocument();

    deferredPlaylist.resolve(playlist);

    expect(
      await screen.findByRole('heading', { name: 'Main informations' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', {
        name: 'Open Drop; Selected: id orga',
      }),
    ).not.toBeDisabled();
    expect(screen.getByDisplayValue('playlist title')).not.toBeDisabled();
    expect(screen.getByDisplayValue('1 year')).not.toBeDisabled();

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

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

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

    expect(
      screen.getByRole('button', { name: 'Delete playlist' }),
    ).toBeInTheDocument();
  });

  it('checks the contents render by playlist', async () => {
    featureContentLoader([]);

    render(<UpdatePlaylistPage playlistId="some-id" />);

    deferredPlaylist.resolve(playlist);

    expect(await screen.findByText('My Webinars')).toBeInTheDocument();
    expect(screen.getByText('My Videos')).toBeInTheDocument();
    expect(screen.getByText('My Classrooms')).toBeInTheDocument();

    expect(
      fetchMock.called(
        '/api/videos/?limit=4&offset=0&ordering=-created_on&is_live=true&playlist=some-id',
      ),
    ).toBe(true);
    expect(
      fetchMock.called(
        '/api/videos/?limit=4&offset=0&ordering=-created_on&is_live=false&playlist=some-id',
      ),
    ).toBe(true);
    expect(
      fetchMock.called('/api/classrooms/?limit=4&offset=0&playlist=some-id'),
    ).toBe(true);
  });
});
