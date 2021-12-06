import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { converse } from 'utils/window';

import { ChatInputBar } from '.';

jest.mock('utils/window', () => ({
  converse: {
    sendMessage: jest.fn(),
  },
}));

describe('<ChatInputBar />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("doesn't send message if the send button is clicked when input is empty", async () => {
    render(wrapInIntlProvider(<ChatInputBar />));
    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');
    await act(async () => {
      userEvent.click(chatSendButton);
    });
    expect(converse.sendMessage).not.toHaveBeenCalled();
    expect(chatInputText).toHaveValue('');
  });

  it('sends message if the send button is clicked when input is filled', async () => {
    render(wrapInIntlProvider(<ChatInputBar />));
    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');
    userEvent.type(chatInputText, 'A simple message');
    await act(async () => {
      userEvent.click(chatSendButton);
    });
    expect(converse.sendMessage).toHaveBeenCalledWith('A simple message');
    expect(chatInputText).toHaveValue('');
  });

  it("doesn't send message if enter key is pressed when input is empty", async () => {
    render(wrapInIntlProvider(<ChatInputBar />));
    const chatInputText = screen.getByRole('textbox');
    await act(async () => {
      userEvent.keyboard('{enter}');
    });
    expect(converse.sendMessage).not.toHaveBeenCalled();
    expect(chatInputText).toHaveValue('');
  });

  it('sends the message if enter key is pressed when input is filled', async () => {
    render(wrapInIntlProvider(<ChatInputBar />));
    const chatInputText = screen.getByRole('textbox');
    userEvent.type(chatInputText, 'A simple message');
    await act(async () => {
      userEvent.keyboard('{enter}');
    });
    expect(converse.sendMessage).toHaveBeenCalledWith('A simple message');
    expect(chatInputText).toHaveValue('');
  });
});
