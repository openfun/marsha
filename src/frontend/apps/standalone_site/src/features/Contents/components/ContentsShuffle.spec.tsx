import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ContentsShuffle from './ContentsShuffle';

jest.mock('features/Contents', () => ({
  ClassRooms: () => <div>Part of my classrooms</div>,
}));

describe('<ContentsShuffle />', () => {
  test('renders ContentsShuffle', () => {
    render(<ContentsShuffle />);
    expect(screen.getByText(/Part of my classrooms/i)).toBeInTheDocument();
  });
});
