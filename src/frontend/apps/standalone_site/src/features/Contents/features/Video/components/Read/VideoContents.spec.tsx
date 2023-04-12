import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import VideoContents from './VideoContents';

interface VideosProps {
  withPagination?: boolean;
  withFilter?: boolean;
  limit?: number;
  playlistId?: string;
}

jest.mock('./Videos', () => ({
  __esModule: true,
  default: ({
    withPagination = true,
    withFilter = true,
    playlistId = '',
    limit,
  }: VideosProps) => (
    <div>
      Videos Component {withPagination} {withFilter} {playlistId} {limit}
    </div>
  ),
}));

describe('<VideoContents />', () => {
  test('renders VideoContents', () => {
    render(<VideoContents />);
    expect(screen.getByText(/My Videos/)).toBeInTheDocument();
    expect(screen.getByText(/Videos Component 4/i)).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toHaveAttribute(
      'href',
      '/my-contents/videos',
    );
  });

  test('renders VideoContents with playlistId', () => {
    render(<VideoContents playlistId="my-playlist-id" />);
    expect(screen.getByText(/My Videos/)).toBeInTheDocument();
    expect(
      screen.getByText(/Videos Component my-playlist-id 4/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toHaveAttribute(
      'href',
      '/my-contents/videos?playlist=my-playlist-id',
    );
  });
});
