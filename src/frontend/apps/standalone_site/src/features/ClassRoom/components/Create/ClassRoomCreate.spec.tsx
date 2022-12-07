import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import ClassRoomCreate from './ClassRoomCreate';

describe('<ClassRoomCreate />', () => {
  test('renders ClassRoomCreate', () => {
    render(<ClassRoomCreate />);

    const button = screen.getByRole('button', { name: /Create Classroom/i });
    expect(button).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Create Classroom/i }),
    ).not.toBeInTheDocument();

    userEvent.click(button);

    expect(
      screen.getByRole('heading', { name: /Create Classroom/i }),
    ).toBeInTheDocument();
  });
});
