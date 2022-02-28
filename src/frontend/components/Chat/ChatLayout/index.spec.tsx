import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useChatItemState } from 'data/stores/useChatItemsStore';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { Nullable } from 'utils/types';
import { converse } from 'utils/window';
import { ChatLayout } from '.';
import { liveRegistrationFactory } from 'utils/tests/factories';
import { useLiveRegistration } from 'data/stores/useLiveRegistration';

window.HTMLElement.prototype.scrollTo = jest.fn();
jest.mock('data/appData', () => ({
  getDecodedJwt: jest.fn(),
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

describe('<StudentChat />', () => {
  it("doesn't receive history messages, no display_name and the join button is disabled.", async () => {
    render(wrapInIntlProvider(<ChatLayout />));
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
    render(wrapInIntlProvider(<ChatLayout />));
    const joinChatButton = screen.getByRole('button', {
      name: 'Join the chat',
    });
    expect(joinChatButton).toBeDisabled();
    act(() => {
      useChatItemState.getState().setHasReceivedMessageHistory(true);
    });
    expect(joinChatButton).not.toBeDisabled();
  });

  it('clicks on the join button and the input display_name is mounted', () => {
    useChatItemState.getState().setHasReceivedMessageHistory(true);
    render(wrapInIntlProvider(<ChatLayout />));
    const joinChatButton = screen.getByRole('button', {
      name: 'Join the chat',
    });
    expect(joinChatButton).not.toBeDisabled();
    act(() => {
      userEvent.click(joinChatButton);
    });
    screen.getByText('Display name');
  });

  it('shows the message input box when liveRegistration exists with a display_name', () => {
    useChatItemState.getState().setHasReceivedMessageHistory(true);
    const liveRegistration = liveRegistrationFactory({ display_name: 'l33t' });
    useLiveRegistration.getState().setLiveRegistration(liveRegistration);
    render(wrapInIntlProvider(<ChatLayout />));
    expect(
      screen.queryByRole('button', {
        name: 'Join the chat',
      }),
    ).not.toBeInTheDocument();
    screen.getByText('Message...');
    expect(screen.queryByText('Display name')).not.toBeInTheDocument();
  });

  /*it('successfully connects an anonymous user and sends a message.', async () => {
    render(wrapInIntlProvider(<StudentChat />));
    const joinChatButton = screen.getByRole('button', {
      name: 'Join the chat',
    });
    expect(joinChatButton).toBeDisabled();
    act(() => {
      useChatItemState.getState().setHasReceivedMessageHistory(true);
    });

    act(() => {
      userEvent.click(joinChatButton);
    });
    const textBoxDisplayName = screen.getByRole('textbox');
    const buttonSendDisplayName = screen.getByRole('button');
    userEvent.type(textBoxDisplayName, 'John Doe');
    act(() => {
      userEvent.click(buttonSendDisplayName);
    });
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenNthCalledWith(
      1,
      'John Doe',
      expect.any(Function),
      expect.any(Function),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    const sendChatButton = screen.getByRole('button');
    const textboxChatInput = screen.getByRole('textbox');
    userEvent.type(textboxChatInput, 'This is an example message.');
    act(() => {
      userEvent.click(sendChatButton);
    });
    expect(converse.sendMessage).toHaveBeenNthCalledWith(
      1,
      'This is an example message.',
    );
    expect(converse.sendMessage).toHaveBeenCalledTimes(1);
  });*/
});
