import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import VideoRouter from './VideoRouter';

jest.mock('./Read/Videos', () => ({
  __esModule: true,
  default: ({ playlistId }: { playlistId: string }) => (
    <div>My VideosRead {playlistId}</div>
  ),
}));

jest.mock('./Create/VideoCreate', () => ({
  __esModule: true,
  default: () => (
    <div>
      <p>My VideoCreate</p>
    </div>
  ),
}));

jest.mock('./Update/VideoUpdate', () => ({
  __esModule: true,
  default: () => (
    <div>
      <p>My Video Update</p>
    </div>
  ),
}));

describe('<VideoRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render route /my-contents/videos?playlist=test-playlist-id', () => {
    render(<VideoRouter />, {
      routerOptions: {
        history: ['/my-contents/videos?playlist=test-playlist-id'],
      },
    });
    expect(screen.getByText(/My VideoCreate/i)).toBeInTheDocument();
    expect(
      screen.getByText('My VideosRead test-playlist-id'),
    ).toBeInTheDocument();
  });

  test('render video no match', () => {
    render(<VideoRouter />, {
      routerOptions: { history: ['/some/bad/route'] },
    });
    expect(screen.queryByText(/My VideoCreate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/My VideosRead/i)).not.toBeInTheDocument();
  });

  test('render create video', () => {
    render(<VideoRouter />, {
      routerOptions: { history: ['/my-contents/videos/create'] },
    });

    expect(screen.getByText(/My VideoCreate/i)).toBeInTheDocument();
    expect(screen.getByText(/My VideosRead/i)).toBeInTheDocument();
  });

  test('render update video', () => {
    render(<VideoRouter />, {
      routerOptions: {
        history: ['/my-contents/videos/123456/'],
      },
    });

    expect(screen.getByText('My Video Update')).toBeInTheDocument();
  });
});
