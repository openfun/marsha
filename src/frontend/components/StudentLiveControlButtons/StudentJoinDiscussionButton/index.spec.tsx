import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MatchMediaMock from 'jest-matchmedia-mock';

import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { converse } from 'utils/window';

import { StudentJoinDiscussionButton } from '.';

let matchMedia: MatchMediaMock;

jest.mock('utils/window', () => ({
  converse: {
    askParticipantToJoin: jest.fn(),
  },
}));

jest.mock('components/SVGIcons/JoinDiscussionSVG', () => ({
  JoinDiscussionSVG: () => <span>join discussion icon</span>,
}));

const mockAskParticipantToJoin =
  converse.askParticipantToJoin as jest.MockedFunction<
    typeof converse.askParticipantToJoin
  >;

describe('<StudentJoinDiscussionButton />', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });

  afterEach(() => {
    matchMedia.clear();
    jest.resetAllMocks();
  });

  beforeEach(() => {
    /*
        Cleanup doesn't clean portal rendered outside of the root div and grommet Layer uses a portal.
        We must remove all body children.
        https://github.com/grommet/grommet/issues/5200#issuecomment-837451175
      */
    document.body.innerHTML = '';
    document.body.appendChild(document.createElement('div'));
  });

  it('renders the ask button', () => {
    render(wrapInIntlProvider(<StudentJoinDiscussionButton />));

    screen.getByRole('button', { name: 'Send request to join the discussion' });
    screen.getByText('join discussion icon');
    expect(
      screen.queryByRole('textbox', { name: 'username' }),
    ).not.toBeInTheDocument();
  });

  it('clicks on the button to ask to join the discussion', async () => {
    render(wrapInIntlProvider(<StudentJoinDiscussionButton />));

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    screen.getByText('join discussion icon');

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockAskParticipantToJoin).toHaveBeenCalled();
    mockAskParticipantToJoin.mockResolvedValue();
    await waitFor(() =>
      expect(useParticipantWorkflow.getState().asked).toEqual(true),
    );
  });

  it('displays the username input text and clicks on cancel button', async () => {
    render(wrapInIntlProvider(<StudentJoinDiscussionButton />));
    mockAskParticipantToJoin.mockRejectedValueOnce(
      Error('must be in the room before asking to join'),
    );

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    screen.getByText('join discussion icon');
    expect(
      screen.queryByRole('textbox', { name: 'username' }),
    ).not.toBeInTheDocument();

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockAskParticipantToJoin).toHaveBeenCalled();

    const inputUsername = await screen.findByRole('textbox', {
      name: 'username',
    });
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    // at first rendering the confirm button is disabled
    expect(confirmButton).toBeDisabled();

    // the input value is filled
    fireEvent.change(inputUsername, { target: { value: 'Joe' } });
    // then the confirm button is enabled
    expect(confirmButton).toBeEnabled();

    // clicking on cancel button remove the input and the ask button is displayed again
    fireEvent.click(cancelButton);
    await screen.findByRole('textbox', { name: 'username' });
    expect(inputUsername).not.toBeInTheDocument();
    screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    screen.getByText('join discussion icon');
  });

  it('displays the username input text and clicks on the confirm button', async () => {
    render(wrapInIntlProvider(<StudentJoinDiscussionButton />));
    mockAskParticipantToJoin
      .mockRejectedValueOnce(Error('must be in the room before asking to join'))
      .mockResolvedValueOnce();

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    screen.getByText('join discussion icon');
    expect(
      screen.queryByRole('textbox', { name: 'username' }),
    ).not.toBeInTheDocument();

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockAskParticipantToJoin).toHaveBeenCalled();

    const inputUsername = await screen.findByRole('textbox', {
      name: 'username',
    });
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    screen.getByRole('button', { name: /cancel/i });

    // at first rendering the confirm button is disabled
    expect(confirmButton).toBeDisabled();

    // the input value is filled
    fireEvent.change(inputUsername, { target: { value: 'Doe' } });
    // then the confirm button is enabled
    expect(confirmButton).toBeEnabled();

    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(useParticipantWorkflow.getState().asked).toEqual(true),
    );
  });
});
