import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';
import { converse } from '@lib-video/utils/window';

import { StudentJoinDiscussionButton } from '.';

jest.mock('utils/window', () => ({
  converse: {
    askParticipantToJoin: jest.fn(),
  },
}));

const mockSetDisplayName = jest.fn();
jest.mock('hooks/useSetDisplayName', () => ({
  useSetDisplayName: () => [false, mockSetDisplayName],
}));

const mockAskParticipantToJoin =
  converse.askParticipantToJoin as jest.MockedFunction<
    typeof converse.askParticipantToJoin
  >;

describe('<StudentJoinDiscussionButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the ask button', () => {
    render(<StudentJoinDiscussionButton />);

    expect(
      screen.getByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).toBeInTheDocument();
  });

  it('clicks on the button to ask to join the discussion when display name is set', async () => {
    useLiveSession.setState({
      liveSession: {
        anonymous_id: 'anonymous-id',
        consumer_site: 'consumer',
        display_name: 'display name',
        email: 'my-email@openfun.fr',
        id: 'id',
        is_registered: true,
        live_attendance: null,
        language: 'fr',
        lti_id: 'lti-id',
        lti_user_id: 'lti-id',
        should_send_reminders: false,
        username: 'username',
        video: 'video',
      },
    });

    render(<StudentJoinDiscussionButton />);

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockAskParticipantToJoin).toHaveBeenCalled();
    mockAskParticipantToJoin.mockResolvedValue();
    await waitFor(() =>
      expect(useParticipantWorkflow.getState().asked).toEqual(true),
    );
  });

  it('clicks on the button ask for display name when one is not set in the live session', () => {
    useLiveSession.setState({
      liveSession: {
        anonymous_id: 'anonymous-id',
        consumer_site: 'consumer',
        display_name: null,
        email: 'my-email@openfun.fr',
        id: 'id',
        is_registered: true,
        language: 'fr',
        live_attendance: null,
        lti_id: 'lti-id',
        lti_user_id: 'lti-id',
        should_send_reminders: false,
        username: 'username',
        video: 'video',
      },
    });

    render(<StudentJoinDiscussionButton />);

    const askButton = screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });

    expect(useParticipantWorkflow.getState().asked).toEqual(false);
    fireEvent.click(askButton);

    expect(mockSetDisplayName).toHaveBeenCalled();
    expect(mockSetDisplayName).toHaveBeenCalledWith(true);
  });
});
