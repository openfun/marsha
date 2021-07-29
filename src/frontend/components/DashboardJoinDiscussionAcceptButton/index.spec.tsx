import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from '../../utils/tests/intl';
import * as mockWindow from '../../utils/window';
import { DashboardJoinDiscussionAcceptButton } from '.';

jest.mock('../../utils/window', () => ({
  converse: {
    acceptParticipantToJoin: jest.fn(),
  },
}));

describe('<DashboardJoinDiscussionAcceptButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('renders the accept button and click on it', () => {
    const participant = {
      id: 'participant1',
      name: 'John Doe',
    };

    render(
      wrapInIntlProvider(
        <DashboardJoinDiscussionAcceptButton participant={participant} />,
      ),
    );

    const acceptButton = screen.getByRole('button', { name: 'accept' });

    fireEvent.click(acceptButton);

    expect(mockWindow.converse.acceptParticipantToJoin).toHaveBeenCalledWith(
      participant,
    );
  });
});
