import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import LiveRouter from './LiveRouter';

jest.mock('./Read/Lives', () => ({
  __esModule: true,
  default: ({ playlistId }: { playlistId: string }) => (
    <div>My Lives Read {playlistId}</div>
  ),
}));

jest.mock('./Manage/LiveManage', () => ({
  __esModule: true,
  default: () => (
    <div>
      <p>My WebinarCreate</p>
    </div>
  ),
}));

jest.mock('./Update/LiveUpdate', () => ({
  __esModule: true,
  default: () => (
    <div>
      <p>My WebinarUpdate</p>
    </div>
  ),
}));

describe('<LiveRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders route /my-contents/webinars?playlist=test-playlist-id', () => {
    render(<LiveRouter />, {
      routerOptions: {
        componentPath: '/my-contents/webinars/*',
        history: ['/my-contents/webinars?playlist=test-playlist-id'],
      },
    });

    expect(screen.getByText('My WebinarCreate')).toBeInTheDocument();
    expect(
      screen.getByText('My Lives Read test-playlist-id'),
    ).toBeInTheDocument();
  });

  it('renders create live', () => {
    render(<LiveRouter />, {
      routerOptions: {
        componentPath: '/my-contents/webinars/*',
        history: ['/my-contents/webinars/create'],
      },
    });
    expect(screen.getByText('My WebinarCreate')).toBeInTheDocument();
    expect(screen.getByText(/My Lives Read/i)).toBeInTheDocument();
  });

  it('renders live no match', () => {
    render(<LiveRouter />, {
      routerOptions: {
        componentPath: '/my-contents/videos/*',
        history: ['/my-contents/videos/some/bad/route'],
      },
    });

    expect(screen.queryByText(/My WebinarCreate/i)).not.toBeInTheDocument();
    expect(screen.queryByText('My Lives Read')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sorry, this page does not exist./i),
    ).toBeInTheDocument();
  });

  it('renders update live', () => {
    render(<LiveRouter />, {
      routerOptions: {
        componentPath: '/my-contents/webinars/*',
        history: ['/my-contents/webinars/123456/'],
      },
    });

    expect(screen.getByText('My WebinarUpdate')).toBeInTheDocument();
  });
});
