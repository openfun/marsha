import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useJwt } from 'data/stores/useJwt';
import { useChatItemState } from 'data/stores/useChatItemsStore';
import { useLiveSession } from 'data/stores/useLiveSession';
import { liveSessionFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { Nullable } from 'utils/types';
import { converse } from 'utils/window';

import { ChatLayout } from '.';

const mockSetDisplayName = jest.fn();
jest.mock('data/stores/useSetDisplayName', () => ({
  useSetDisplayName: () => [false, mockSetDisplayName],
}));

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

jest.mock('utils/window', () => ({
  converse: {
    claimNewNicknameInChatRoom: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

const mockConverse = converse.claimNewNicknameInChatRoom as jest.MockedFunction<
  typeof converse.claimNewNicknameInChatRoom
>;

mockConverse.mockImplementation(
  (
    _displayName: string,
    callbackSuccess: () => void,
    _callbackError: (stanza: Nullable<HTMLElement>) => void,
  ) => {
    callbackSuccess();
  },
);

describe('<ChatLayout />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: jest.fn(),
    });
  });

  it("doesn't receive history messages, no display_name and the join button is disabled.", async () => {
    render(<ChatLayout />);

    // If no set, hasReceivedMessageHistory default value is false
    expect(useChatItemState.getState().hasReceivedMessageHistory).toEqual(
      false,
    );
    const joinChatButton = screen.getByRole('button', {
      name: 'Join the chat',
    });
    expect(joinChatButton).toBeDisabled();
    act(() => {
      userEvent.click(joinChatButton);
    });
    expect(screen.queryByText('Display name')).not.toBeInTheDocument();
  });

  it('has received history message and has no display_name, the join button is not disabled anymore.', () => {
    render(<ChatLayout />);

    const joinChatButton = screen.getByRole('button', {
      name: 'Join the chat',
    });
    expect(joinChatButton).toBeDisabled();
    act(() => {
      useChatItemState.getState().setHasReceivedMessageHistory(true);
    });
    expect(joinChatButton).not.toBeDisabled();
  });

  it('shows the message input box when liveSession exists with a display_name', () => {
    useChatItemState.getState().setHasReceivedMessageHistory(true);
    const liveSession = liveSessionFactory({ display_name: 'l33t' });
    useLiveSession.getState().setLiveSession(liveSession);

    render(<ChatLayout />);

    expect(
      screen.queryByRole('button', {
        name: 'Join the chat',
      }),
    ).not.toBeInTheDocument();
    screen.getByText('Message...');
    expect(screen.queryByText('Display name')).not.toBeInTheDocument();
  });

  it('configures to ask for display name on ask button click', () => {
    useChatItemState.getState().setHasReceivedMessageHistory(true);

    render(<ChatLayout />);

    userEvent.click(
      screen.getByRole('button', {
        name: 'Join the chat',
      }),
    );

    expect(mockSetDisplayName).toHaveBeenCalledWith(true);
  });
});
