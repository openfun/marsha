import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ClassRoomShuffle from './ClassRoomShuffle';

jest.mock('./ClassRooms', () => ({
  __esModule: true,
  default: () => <div>Part of my classrooms</div>,
}));

describe('<ClassRoomShuffle />', () => {
  test('renders ClassRoomShuffle', () => {
    render(<ClassRoomShuffle />);
    expect(screen.getByText(/Part of my classrooms/i)).toBeInTheDocument();
  });
});
