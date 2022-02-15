import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useChatItemState } from 'data/stores/useChatItemsStore';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { Nullable } from 'utils/types';
import { converse } from 'utils/window';
import { StudentChat } from '.';

window.HTMLElement.prototype.scrollTo = jest.fn();
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
  it("doesn't receive history messages and clicks on the join button.", async () => {
    render(wrapInIntlProvider(<StudentChat />));
    // If no set, hasReceivedMessageHistory default value is false
    const joinChatButton = screen.getByRole('button', {
      name: 'Join the chat',
    });
    expect(joinChatButton).toBeDisabled();
    act(() => {
      userEvent.click(joinChatButton);
    });
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('successfully connects an anonymous user and sends a message.', async () => {
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
  });
});
