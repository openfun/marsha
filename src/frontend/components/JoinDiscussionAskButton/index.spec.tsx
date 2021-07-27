import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { PUBLIC_JITSI_ROUTE } from '../PublicVideoLiveJitsi/route';
import { useParticipantWorkflow } from '../../data/stores/useParticipantWorkflow';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import * as mockWindow from '../../utils/window';
import { JoinDiscussionAskButton } from '.';

jest.mock('../../utils/window', () => ({
  converse: {
    askParticipantToJoin: jest.fn(),
  },
}));

describe('<JoinDiscussionAskButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('renders the ask button', () => {
    render(wrapInIntlProvider(<JoinDiscussionAskButton />));

    screen.getByRole('button', { name: 'Send request to join the discussion' });
    expect(
      screen.queryByText("Waiting for Instructor's response"),
    ).not.toBeInTheDocument();
  });

  it('clicks on the button to ask to join the discussion', () => {
    render(wrapInIntlProvider(<JoinDiscussionAskButton />));

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByText("Waiting for Instructor's response"),
    ).not.toBeInTheDocument();

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockWindow.converse.askParticipantToJoin).toHaveBeenCalled();
    expect(useParticipantWorkflow.getState().asked).toEqual(true);

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
        wrapInRouter(<JoinDiscussionAskButton />, [
          {
            path: PUBLIC_JITSI_ROUTE(),
            render: ({ match }) => {
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

  it('clicks on the button to ask to join the discussion and the request is rejected', () => {
    render(wrapInIntlProvider(<JoinDiscussionAskButton />));

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
    expect(
      screen.queryByText("Waiting for Instructor's response"),
    ).not.toBeInTheDocument();

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockWindow.converse.askParticipantToJoin).toHaveBeenCalled();
    expect(useParticipantWorkflow.getState().asked).toEqual(true);

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
});
