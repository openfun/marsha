import { screen, fireEvent } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import ClassRoomCreate from './ClassRoomCreate';

describe('<ClassRoomCreate />', () => {
  test('renders ClassRoomCreate', () => {
    render(<ClassRoomCreate />);

    const button = screen.getByRole('button', { name: /Add Classroom/i });
    expect(button).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Add Classroom/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(
      screen.getByRole('heading', { name: /Add Classroom/i }),
    ).toBeInTheDocument();
  });
});
