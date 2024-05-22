import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import {
  DashboardClassroomAskUsername,
  DashboardClassroomAskUsernameStudent,
} from '.';

const onJoin = jest.fn();
const onCancel = jest.fn();

describe('<DashboardClassroomAskUsername />', () => {
  it('displays the form with cancel button', async () => {
    const userFullname = 'Initial value';
    const mockSetUserFullname = jest.fn();

    render(
      <DashboardClassroomAskUsername
        userFullname={userFullname}
        setUserFullname={mockSetUserFullname}
        onJoin={onJoin}
        onCancel={onCancel}
      />,
    );

    screen.getByText('Please enter your name to join the classroom');
    const inputUsername = screen.getByDisplayValue('Initial value');
    expect(inputUsername).toHaveValue(userFullname);

    fireEvent.change(inputUsername, { target: { value: 'Joe' } });
    expect(mockSetUserFullname).toHaveBeenCalledWith('Joe');

    await userEvent.type(inputUsername, '{enter}');
    expect(onJoin).toHaveBeenCalledTimes(1);

    const joinButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(joinButton);
    expect(onJoin).toHaveBeenCalledTimes(2);

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

  describe('<DashboardClassroomAskUsernameStudent />', () => {
    it('checks the recording checkbox interaction with the join button', () => {
      const userFullname = 'Initial value';
      const mockSetUserFullname = jest.fn();
      render(
        <DashboardClassroomAskUsernameStudent
          userFullname={userFullname}
          setUserFullname={mockSetUserFullname}
          onJoin={onJoin}
          isRecordingEnabled
          recordingPurpose="My recording purpose"
        />,
      );

      const joinButton = screen.getByRole('button', {
        name: /Join/i,
      });
      expect(screen.getByText('My recording purpose')).toBeInTheDocument();
      expect(joinButton).toBeDisabled();

      screen
        .getByRole('checkbox', {
          name: /Do you accept to be recorded/i,
        })
        .click();

      expect(joinButton).toBeEnabled();
    });

    it('displays without recording enabled', () => {
      const userFullname = 'Initial value';
      const mockSetUserFullname = jest.fn();
      render(
        <DashboardClassroomAskUsernameStudent
          userFullname={userFullname}
          setUserFullname={mockSetUserFullname}
          onJoin={onJoin}
          isRecordingEnabled={false}
          recordingPurpose="My recording purpose"
        />,
      );

      expect(
        screen.queryByRole('checkbox', {
          name: /Do you accept to be recorded/i,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('My recording purpose'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /Join/i,
        }),
      ).toBeEnabled();
    });
  });
});
