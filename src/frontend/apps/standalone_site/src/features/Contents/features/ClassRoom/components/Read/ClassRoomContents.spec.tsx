import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ClassRoomContents from './ClassRoomContents';

jest.mock('./ClassRooms', () => ({
  __esModule: true,
  default: () => <div>Classrooms Component</div>,
}));

describe('<ClassRoomContents />', () => {
  test('renders ClassRoomContents', () => {
    render(<ClassRoomContents />);
    expect(screen.getByText(/My Classrooms/)).toBeInTheDocument();
    expect(screen.getByText(/Classrooms Component/i)).toBeInTheDocument();
    expect(screen.getByText(/See Everything/i)).toBeInTheDocument();
  });
});
