import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { converse } from 'utils/window';
import { StudentChat } from '.';

window.HTMLElement.prototype.scrollTo = jest.fn();

jest.mock('utils/window', () => ({
  converse: {
    claimNewNicknameInChatRoom: jest.fn(),
    sendMessage: jest.fn(),
  },
}));

describe('<StudentChat />', () => {
  it('connects an anonymous user and sends a message.', async () => {
    jest.useFakeTimers();
    render(wrapInIntlProvider(<StudentChat />));
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    const joinChatButton = screen.getByRole('button', {
      name: 'Join the chat',
    });
    await act(async () => {
      userEvent.click(joinChatButton);
    });
    const textBoxDisplayName = screen.getByRole('textbox');
    const buttonSendDisplayName = screen.getByRole('button');
    userEvent.type(textBoxDisplayName, 'John Doe');
    await act(async () => {
      userEvent.click(buttonSendDisplayName);
    });
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenNthCalledWith(
      1,
      'John Doe',
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    const sendChatButton = screen.getByRole('button');
    const textboxChatInput = screen.getByRole('textbox');
    userEvent.type(textboxChatInput, 'This is an example message.');
    await act(async () => {
      userEvent.click(sendChatButton);
    });
    expect(converse.sendMessage).toHaveBeenNthCalledWith(
      1,
      'This is an example message.',
    );
    expect(converse.sendMessage).toHaveBeenCalledTimes(1);
  });
});
