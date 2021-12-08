import { DateTime } from 'luxon';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useMessagesState } from 'data/stores/useMessagesStore';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { converse } from 'utils/window';
import { StudentChat } from '.';

window.HTMLElement.prototype.scrollTo = jest.fn();

const sendMessageMock = (msgContent: string) =>
  act(() =>
    useMessagesState.getState().addMessage({
      sentAt: DateTime.fromISO('2020-01-01T12:12:12'),
      sender: 'John Doe',
      content: msgContent,
    }),
  );

jest.mock('utils/window', () => ({
  converse: {
    sendMessage: jest.fn(sendMessageMock),
  },
}));

describe('<StudentChat />', () => {
  it('checks that a message is displayed after having been send with the input bar', async () => {
    jest.useFakeTimers();
    render(wrapInIntlProvider(<StudentChat />));
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');
    userEvent.type(chatInputText, 'A simple message.');
    await act(async () => {
      userEvent.click(chatSendButton);
    });
    expect(converse.sendMessage).toHaveBeenCalledWith('A simple message.');
    expect(chatInputText).toHaveValue('');

    screen.getByText('(12:12)');
    screen.getByText('John Doe');
    screen.getByText('A simple message.');
  });
});
