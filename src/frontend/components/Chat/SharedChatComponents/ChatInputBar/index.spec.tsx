import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ChatInputBar } from '.';
import { wrapInIntlProvider } from '../../../../utils/tests/intl';
import { converse } from '../../../../utils/window';

jest.mock('../../../../utils/window', () => ({
  converse: {
    sendMessageWithConverse: jest.fn(),
  },
}));

describe('<ChatInputBar />', () => {
  it('emulates a click on the send button when input is empty', async () => {
    render(wrapInIntlProvider(<ChatInputBar />));
    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');
    await act(async () => {
      userEvent.click(chatSendButton);
    });
    expect(converse.sendMessageWithConverse).not.toHaveBeenCalled();
    expect(chatInputText).toHaveValue('');
  });

  it('emulates a click on the send button when input is filled', async () => {
    render(wrapInIntlProvider(<ChatInputBar />));
    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');
    userEvent.type(chatInputText, 'A simple message');
    await act(async () => {
      userEvent.click(chatSendButton);
    });
    expect(converse.sendMessageWithConverse).toHaveBeenCalledWith(
      'A simple message',
    );
    expect(chatInputText).toHaveValue('');
  });

  it('emulates enter key press when input is filled', async () => {
    render(wrapInIntlProvider(<ChatInputBar />));
    const chatInputText = screen.getByRole('textbox');
    userEvent.type(chatInputText, 'A simple message');
    await act(async () => {
      userEvent.keyboard('{enter}');
    });
    expect(converse.sendMessageWithConverse).toHaveBeenCalledWith(
      'A simple message',
    );
    expect(chatInputText).toHaveValue('');
  });
});
