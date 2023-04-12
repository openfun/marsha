import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import LiveContents from './LiveContents';

interface LivesProps {
  withPagination?: boolean;
  withFilter?: boolean;
  limit?: number;
  playlistId?: string;
}

jest.mock('./Lives', () => ({
  __esModule: true,
  default: ({
    withPagination = true,
    withFilter = true,
    playlistId = '',
    limit,
  }: LivesProps) => (
    <div>
      Webinars Component {withPagination} {withFilter} {playlistId} {limit}
    </div>
  ),
}));

describe('<LiveContents />', () => {
  test('renders LiveContents', () => {
    render(<LiveContents />);
    expect(screen.getByText(/My Webinars/)).toBeInTheDocument();
    expect(screen.getByText(/Webinars Component 4/i)).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toHaveAttribute(
      'href',
      '/my-contents/webinars',
    );
  });

  test('renders LiveContents with playlistId', () => {
    render(<LiveContents playlistId="my-playlist-id" />);
    expect(screen.getByText(/My Webinars/)).toBeInTheDocument();
    expect(
      screen.getByText(/Webinars Component my-playlist-id 4/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toHaveAttribute(
      'href',
      '/my-contents/webinars?playlist=my-playlist-id',
    );
  });
});
