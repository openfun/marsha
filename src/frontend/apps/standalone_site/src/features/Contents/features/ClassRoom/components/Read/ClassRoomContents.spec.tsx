import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ClassRoomContents from './ClassRoomContents';

interface ClassRoomsProps {
  withPagination?: boolean;
  withFilter?: boolean;
  limit?: number;
  playlistId?: string;
}

jest.mock('./ClassRooms', () => ({
  __esModule: true,
  default: ({
    withPagination = true,
    withFilter = true,
    playlistId = '',
    limit,
  }: ClassRoomsProps) => (
    <div>
      Classrooms Component {withPagination} {withFilter} {playlistId} {limit}
    </div>
  ),
}));

describe('<ClassRoomContents />', () => {
  test('renders ClassRoomContents', () => {
    render(<ClassRoomContents />);
    expect(screen.getByText(/My Classrooms/)).toBeInTheDocument();
    expect(screen.getByText(/Classrooms Component 4/i)).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toHaveAttribute(
      'href',
      '/my-contents/classroom',
    );
  });

  test('renders ClassRoomContents with playlistId', () => {
    render(<ClassRoomContents playlistId="my-playlist-id" />);
    expect(screen.getByText(/My Classrooms/)).toBeInTheDocument();
    expect(
      screen.getByText(/Classrooms Component my-playlist-id 4/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toHaveAttribute(
      'href',
      '/my-contents/classroom?playlist=my-playlist-id',
    );
  });
});
