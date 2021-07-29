import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from '../../utils/tests/intl';
import * as mockWindow from '../../utils/window';
import { DashboardJoinDiscussionRejectButton } from '.';

jest.mock('../../utils/window', () => ({
  converse: {
    rejectParticipantToJoin: jest.fn(),
  },
}));

describe('<DashboardJoinDiscussionRejectButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('renders the button and click on it', () => {
    const participant = {
      id: 'participant1',
      name: 'John Doe',
    };

    render(
      wrapInIntlProvider(
        <DashboardJoinDiscussionRejectButton participant={participant} />,
      ),
    );

    const rejectButton = screen.getByRole('button', { name: 'reject' });

    fireEvent.click(rejectButton);
    expect(mockWindow.converse.rejectParticipantToJoin).toHaveBeenCalledWith(
      participant,
    );
  });
});
