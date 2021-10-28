import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import DashboardMeetingAskUsername from '.';

const closeAskUserNameAction = jest.fn();
const onJoin = jest.fn();
const onCancel = jest.fn();

describe('<DashboardMeetingAskUsername />', () => {
  beforeEach(() => {
    /*
      make sure to remove all body children, grommet layer gets rendered twice, known issue
      https://github.com/grommet/grommet/issues/5200
    */
    document.body.innerHTML = '';
    document.body.appendChild(document.createElement('div'));
  });

  it('displays the form with cancel button', () => {
    const userFullname = 'Initial value';
    const mockSetUserFullname = jest.fn();

    const { getByText } = render(
      wrapInIntlProvider(
        <DashboardMeetingAskUsername
          userFullname={userFullname}
          setUserFullname={mockSetUserFullname}
          onJoin={onJoin}
          onCancel={onCancel}
        />,
      ),
    );

    getByText('Please enter your name to join the meeting');
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
      wrapInIntlProvider(
        <DashboardMeetingAskUsername
          userFullname={userFullname}
          setUserFullname={mockSetUserFullname}
          onJoin={onJoin}
        />,
      ),
    );

    const cancelButton = screen.queryByText('Cancel');
    expect(cancelButton).toBeNull();
    expect(mockSetUserFullname).toHaveBeenCalledTimes(0);
  });
});
