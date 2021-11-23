import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';

import { PUBLIC_JITSI_ROUTE } from 'components/PublicVideoLiveJitsi/route';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import { converse } from 'utils/window';

import { StudentJoinDiscussionButton } from '.';

jest.mock('utils/window', () => ({
  converse: {
    askParticipantToJoin: jest.fn(),
  },
}));

const mockAskParticipantToJoin =
  converse.askParticipantToJoin as jest.MockedFunction<
    typeof converse.askParticipantToJoin
  >;

describe('<StudentJoinDiscussionButton />', () => {
  afterEach(() => {
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
    expect(
      screen.queryByText("Waiting for Instructor's response"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'username' }),
    ).not.toBeInTheDocument();
  });

  it('clicks on the button to ask to join the discussion', async () => {
    render(wrapInIntlProvider(<StudentJoinDiscussionButton />));

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByText("Waiting for Instructor's response"),
    ).not.toBeInTheDocument();

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockAskParticipantToJoin).toHaveBeenCalled();
    mockAskParticipantToJoin.mockResolvedValue();
    await waitFor(() =>
      expect(useParticipantWorkflow.getState().asked).toEqual(true),
    );

    screen.getByText("Waiting for Instructor's response");
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('redirects to JITSI PUBLIC route when accepted', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(<StudentJoinDiscussionButton />, [
          {
            path: PUBLIC_JITSI_ROUTE(),
            render: () => {
              return <span>{'public video jitsi'}</span>;
            },
          },
        ]),
      ),
    );

    screen.getByRole('button', { name: 'Send request to join the discussion' });

    act(() => {
      // set accepted to true
      useParticipantWorkflow.getState().setAccepted();
    });

    screen.getByText('public video jitsi');
  });

  it('clicks on the button to ask to join the discussion and the request is rejected', async () => {
    render(wrapInIntlProvider(<StudentJoinDiscussionButton />));

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByText("Waiting for Instructor's response"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'username' }),
    ).not.toBeInTheDocument();

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockAskParticipantToJoin).toHaveBeenCalled();
    mockAskParticipantToJoin.mockResolvedValue();
    await waitFor(() =>
      expect(useParticipantWorkflow.getState().asked).toEqual(true),
    );

    screen.getByText("Waiting for Instructor's response");
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();

    act(() => {
      // set rejected to true
      useParticipantWorkflow.getState().setRejected();
    });

    screen.getByText(
      'Your request to join the discussion has not been accepted.',
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
    expect(
      screen.queryByText("Waiting for Instructor's response"),
    ).not.toBeInTheDocument();
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
  });

  it('displays the username input text and clicks on the confirm button', async () => {
    render(wrapInIntlProvider(<StudentJoinDiscussionButton />));
    mockAskParticipantToJoin
      .mockRejectedValueOnce(Error('must be in the room before asking to join'))
      .mockResolvedValueOnce();

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByText("Waiting for Instructor's response"),
    ).not.toBeInTheDocument();
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
