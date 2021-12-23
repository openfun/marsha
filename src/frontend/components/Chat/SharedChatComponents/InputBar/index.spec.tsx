import { Grommet } from 'grommet';
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { imageSnapshot, renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { theme } from 'utils/theme/theme';
import { InputBar } from '.';

const mockHandleUserInputSuccess = jest.fn().mockReturnValue(1);
const mockHandleUserInputFailure = jest.fn().mockReturnValue(0);

const exampleTextPlaceholder = 'An example placeholder';

// The format is always 'chatInput' here because whether a format or another is used,
// the under-the-hood functionnal is stricly the same
describe('<InputBar /> functionnal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("doesn't process the input value if the send button is clicked when input is empty", async () => {
    render(
      wrapInIntlProvider(
        <InputBar
          handleUserInput={mockHandleUserInputSuccess}
          isChatInput={true}
          placeholderText={exampleTextPlaceholder}
        />,
      ),
    );
    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');
    await act(async () => {
      userEvent.click(chatSendButton);
    });
    expect(mockHandleUserInputSuccess).not.toHaveBeenCalled();
    expect(chatInputText).toHaveValue('');
  });

  it("doesn't process the input value if enter key is pressed when input is empty", async () => {
    render(
      wrapInIntlProvider(
        <InputBar
          handleUserInput={mockHandleUserInputSuccess}
          isChatInput={true}
          placeholderText={exampleTextPlaceholder}
        />,
      ),
    );
    const chatInputText = screen.getByRole('textbox');
    await act(async () => {
      userEvent.keyboard('{enter}');
    });
    expect(mockHandleUserInputSuccess).not.toHaveBeenCalled();
    expect(chatInputText).toHaveValue('');
  });

  it('processes the input value if the send button is clicked when input is filled', async () => {
    render(
      wrapInIntlProvider(
        <InputBar
          handleUserInput={mockHandleUserInputSuccess}
          isChatInput={true}
          placeholderText={exampleTextPlaceholder}
        />,
      ),
    );
    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');
    userEvent.type(chatInputText, 'A simple message');
    await act(async () => {
      userEvent.click(chatSendButton);
    });
    expect(mockHandleUserInputSuccess).toHaveBeenCalledWith('A simple message');
    expect(chatInputText).toHaveValue('');
  });

  it('processes the input value if enter key is pressed when input is filled', async () => {
    render(
      wrapInIntlProvider(
        <InputBar
          handleUserInput={mockHandleUserInputSuccess}
          isChatInput={true}
          placeholderText={exampleTextPlaceholder}
        />,
      ),
    );
    const chatInputText = screen.getByRole('textbox');
    userEvent.type(chatInputText, 'A simple message');
    await act(async () => {
      userEvent.keyboard('{enter}');
    });
    expect(mockHandleUserInputSuccess).toHaveBeenCalledWith('A simple message');
    expect(chatInputText).toHaveValue('');
  });

  it("doesn't clean the input bar, if valid input is submitted, but handling function returns 0.", async () => {
    render(
      wrapInIntlProvider(
        <InputBar
          handleUserInput={mockHandleUserInputFailure}
          isChatInput={true}
          placeholderText={exampleTextPlaceholder}
        />,
      ),
    );
    const chatInputText = screen.getByRole('textbox');
    userEvent.type(chatInputText, 'A simple message');
    await act(async () => {
      userEvent.keyboard('{enter}');
    });
    expect(mockHandleUserInputFailure).toHaveBeenCalledWith('A simple message');
    expect(chatInputText).toHaveValue('A simple message');
  });
});

describe('<InputBar /> UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays the component in 'chatInput' format (without value typed) and compares it with previous renders.", async () => {
    await renderImageSnapshot(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={true}
        placeholderText={exampleTextPlaceholder}
      />,
    );
    screen.getByText(exampleTextPlaceholder);
  });

  it("displays the component in 'chatInput' format (with value typed) and compares it with previous renders.", async () => {
    render(
      wrapInIntlProvider(
        <Grommet theme={theme} style={{ height: '100%' }}>
          <InputBar
            handleUserInput={mockHandleUserInputSuccess}
            isChatInput={true}
            placeholderText={exampleTextPlaceholder}
          />
        </Grommet>,
      ),
    );
    const chatInputText = screen.getByRole('textbox');
    userEvent.type(chatInputText, 'A text input example');
    await imageSnapshot();
  });

  it("displays the component in 'not-chatInput' format (without value typed) and compares it with previous renders.", async () => {
    await renderImageSnapshot(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={false}
        placeholderText={exampleTextPlaceholder}
      />,
    );
    screen.getByText(exampleTextPlaceholder);
  });

  it("displays the component in 'not-chatInput' format (with value typed) and compares it with previous renders.", async () => {
    render(
      wrapInIntlProvider(
        <Grommet theme={theme} style={{ height: '100%' }}>
          <InputBar
            handleUserInput={mockHandleUserInputSuccess}
            isChatInput={false}
            placeholderText={exampleTextPlaceholder}
          />
        </Grommet>,
      ),
    );
    const chatInputText = screen.getByRole('textbox');
    userEvent.type(chatInputText, 'A text input example');
    await imageSnapshot();
  });

  it("displays the component in 'not-chatInput' format, with little width (for text placeholder ellipsis) and compares it with previous renders.", async () => {
    await renderImageSnapshot(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={false}
        placeholderText={exampleTextPlaceholder}
      />,
      150,
    );
    screen.getByText(exampleTextPlaceholder);
  });
});
