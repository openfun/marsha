import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from '../../utils/tests/intl';
import * as mockWindow from '../../utils/window';
import { DashboardJoinDiscussionKickButton } from '.';

jest.mock('../../utils/window', () => ({
  converse: {
    kickParticipant: jest.fn(),
  },
}));

describe('<DashboardJoinDiscussionKickButton />', () => {
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
        <DashboardJoinDiscussionKickButton participant={participant} />,
      ),
    );

    const kickButton = screen.getByRole('button', {
      name: 'kick out participant',
    });

    fireEvent.click(kickButton);

    expect(mockWindow.converse.kickParticipant).toHaveBeenCalledWith(
      participant,
    );
  });
});
