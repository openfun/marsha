import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import LiveRouter from './LiveRouter';

jest.mock('./Read/Lives', () => ({
  __esModule: true,
  default: ({ playlistId }: { playlistId: string }) => (
    <div>My Lives Read {playlistId}</div>
  ),
}));

describe('<LiveRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render route /my-contents/webinars?playlist=test-playlist-id', () => {
    render(<LiveRouter />, {
      routerOptions: {
        history: ['/my-contents/webinars?playlist=test-playlist-id'],
      },
    });

    expect(
      screen.getByRole('button', { name: 'Create Webinar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('My Lives Read test-playlist-id'),
    ).toBeInTheDocument();
  });

  test('render create live', async () => {
    render(<LiveRouter />, {
      routerOptions: { history: ['/my-contents/webinars/create'] },
    });
    expect(
      await screen.findByRole('heading', {
        name: 'Create Webinar',
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My Lives Read/i)).toBeInTheDocument();
  });

  test('render live no match', () => {
    render(<LiveRouter />, {
      routerOptions: { history: ['/some/bad/route'] },
    });

    expect(
      screen.queryByRole('button', { name: 'Create Webinar' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('My Lives Read')).not.toBeInTheDocument();
  });
});
