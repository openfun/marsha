import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';

import { PlaylistRole } from '../types/playlistAccess';

import { PlaylistUserList } from './PlaylistUserList';

describe('<PlaylistUserList />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders a label when there is no playlist access', async () => {
    const deferred = new Deferred();
    fetchMock.mock(
      '/api/playlist-accesses/?limit=20&playlist_id=some-id&offset=0',
      deferred.promise,
    );

    render(<PlaylistUserList playlistId="some-id" />);

    expect(await screen.findByRole('status')).toBeInTheDocument();

    deferred.reject(500);

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();
    expect(
      screen.getByText('An error occurred, please try again later.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    fetchMock.mock(
      '/api/playlist-accesses/?limit=20&playlist_id=some-id&offset=0',
      { count: 0, results: [] },
      { overwriteRoutes: true },
    );
    userEvent.click(retryButton);

    expect(
      await screen.findByText(
        'There are no access configured for this playlist. Please contact your administrator.',
      ),
    ).toBeInTheDocument();
  });

  it('renders access rows', async () => {
    fetchMock.mock(
      '/api/playlist-accesses/?limit=20&playlist_id=some-id&offset=0',
      {
        count: 3,
        results: [
          {
            id: 'id 1',
            user: { full_name: 'sbire 1' },
            role: PlaylistRole.ADMINISTRATOR,
          },
          {
            id: 'id 2',
            user: { full_name: 'sbire 2' },
            role: PlaylistRole.INSTRUCTOR,
          },
          {
            id: 'id 3',
            user: { full_name: 'sbire 3' },
            role: PlaylistRole.INSTRUCTOR,
          },
        ],
      },
    );

    render(<PlaylistUserList playlistId="some-id" />);

    expect(await screen.findByText('sbire 1')).toBeInTheDocument();
    expect(screen.getByText('sbire 2')).toBeInTheDocument();
    expect(screen.getByText('sbire 3')).toBeInTheDocument();
  });
});
