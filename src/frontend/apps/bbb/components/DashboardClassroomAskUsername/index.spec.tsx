import { fireEvent, screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';

import DashboardClassroomAskUsername from '.';

const onJoin = jest.fn();
const onCancel = jest.fn();

describe('<DashboardClassroomAskUsername />', () => {
  it('displays the form with cancel button', () => {
    const userFullname = 'Initial value';
    const mockSetUserFullname = jest.fn();

    const { getByText } = render(
      <DashboardClassroomAskUsername
        userFullname={userFullname}
        setUserFullname={mockSetUserFullname}
        onJoin={onJoin}
        onCancel={onCancel}
      />,
    );

    getByText('Please enter your name to join the classroom');
    const inputUsername = screen.getByDisplayValue('Initial value');
    expect(inputUsername).toHaveValue(userFullname);

    fireEvent.change(inputUsername, { target: { value: 'Joe' } });
    expect(mockSetUserFullname).toHaveBeenCalledWith('Joe');

    const joinButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(joinButton);
    expect(onJoin).toHaveBeenCalled();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalled();
  });

  it('displays the form without cancel button', () => {
    const userFullname = '';
    const mockSetUserFullname = jest.fn();
    render(
      <DashboardClassroomAskUsername
        userFullname={userFullname}
        setUserFullname={mockSetUserFullname}
        onJoin={onJoin}
      />,
    );

    const cancelButton = screen.queryByText('Cancel');
    expect(cancelButton).toBeNull();
    expect(mockSetUserFullname).toHaveBeenCalledTimes(0);
  });
});
