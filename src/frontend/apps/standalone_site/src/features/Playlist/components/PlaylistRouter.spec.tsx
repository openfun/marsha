import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { PlaylistRouter } from './PlaylistRouter';

jest.mock('./PlaylistPage', () => ({
  PlaylistPage: () => <span>playlist page</span>,
}));

jest.mock('../features/UpdatePlaylist', () => ({
  UpdatePlaylistPage: () => <span>update playlist page</span>,
}));

describe('<PlaylistRouter />', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('renders PlaylistPage by default', () => {
    render(<PlaylistRouter />);

    expect(screen.getByText('playlist page')).toBeInTheDocument();
  });

  it('renders update playlist page', () => {
    render(<PlaylistRouter />, {
      routerOptions: {
        componentPath: '/my-playlists/id/update',
      },
    });

    expect(screen.getByText('update playlist page')).toBeInTheDocument();
  });
});
