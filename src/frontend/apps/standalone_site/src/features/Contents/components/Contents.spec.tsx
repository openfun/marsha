import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import Contents from './Contents';

jest.mock('features/Contents', () => ({
  ClassRooms: () => <div>Classrooms Component</div>,
}));

describe('<Contents />', () => {
  test('renders Contents', () => {
    render(<Contents />);
    expect(screen.getByText(/My Classrooms/)).toBeInTheDocument();
    expect(screen.getByText(/Classrooms Component/i)).toBeInTheDocument();
  });
});
