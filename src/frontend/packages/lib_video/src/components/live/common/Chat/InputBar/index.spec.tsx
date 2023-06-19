/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { theme } from 'lib-common';
import { imageSnapshot, render, renderImageSnapshot } from 'lib-tests';

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
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={true}
        placeholderText={exampleTextPlaceholder}
      />,
    );

    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');

    await userEvent.click(chatSendButton);

    expect(mockHandleUserInputSuccess).not.toHaveBeenCalled();
    expect(chatInputText).toHaveValue('');
  });

  it("doesn't process the input value if enter key is pressed when input is empty", async () => {
    render(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={true}
        placeholderText={exampleTextPlaceholder}
      />,
    );
    const chatInputText = screen.getByRole('textbox');

    await userEvent.keyboard('{enter}');

    expect(mockHandleUserInputSuccess).not.toHaveBeenCalled();
    expect(chatInputText).toHaveValue('');
  });

  it('processes the input value if the send button is clicked when input is filled', async () => {
    render(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={true}
        placeholderText={exampleTextPlaceholder}
      />,
    );
    const chatInputText = screen.getByRole('textbox');
    const chatSendButton = screen.getByRole('button');
    await userEvent.type(chatInputText, 'A simple message');
    await userEvent.click(chatSendButton);

    await waitFor(() =>
      expect(mockHandleUserInputSuccess).toHaveBeenCalledWith(
        'A simple message',
      ),
    );
    expect(chatInputText).toHaveValue('');
  });

  it('processes the input value if enter key is pressed when input is filled', async () => {
    render(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={true}
        placeholderText={exampleTextPlaceholder}
      />,
    );
    const chatInputText = screen.getByRole('textbox');
    await userEvent.type(chatInputText, 'A simple message');

    await userEvent.keyboard('{enter}');

    await waitFor(() =>
      expect(mockHandleUserInputSuccess).toHaveBeenCalledWith(
        'A simple message',
      ),
    );
    expect(chatInputText).toHaveValue('');
  });

  it("doesn't clean the input bar, if valid input is submitted, but handling function returns 0.", async () => {
    render(
      <InputBar
        handleUserInput={mockHandleUserInputFailure}
        isChatInput={true}
        placeholderText={exampleTextPlaceholder}
      />,
    );
    const chatInputText = screen.getByRole('textbox');
    await userEvent.type(chatInputText, 'A simple message');

    await userEvent.keyboard('{enter}');

    await waitFor(() =>
      expect(mockHandleUserInputFailure).toHaveBeenCalledWith(
        'A simple message',
      ),
    );
    expect(chatInputText).toHaveValue('A simple message');
  });

  it('displays input bar when it is waiting and checks that input bar and spinner button are disabled.', async () => {
    const { container } = render(
      <InputBar
        handleUserInput={mockHandleUserInputFailure}
        isChatInput={true}
        isWaiting
        placeholderText={exampleTextPlaceholder}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
    const chatInputText = screen.getByRole('textbox');
    expect(chatInputText).toBeDisabled();
    await userEvent.type(chatInputText, 'A simple message');
    expect(chatInputText).toHaveValue('');
    const chatInputButton = screen.getByRole('button');
    expect(chatInputButton).toBeDisabled();

    await userEvent.keyboard('{enter}');

    expect(mockHandleUserInputFailure).not.toHaveBeenCalledWith();
  });

  it('displays input bar when it is disabled and checks that input bar and validation button are disabled.', async () => {
    const { container } = render(
      <InputBar
        handleUserInput={mockHandleUserInputFailure}
        isChatInput={true}
        isDisabled
        placeholderText={exampleTextPlaceholder}
      />,
    );
    expect(container.querySelector('svg')).toBeTruthy();
    const chatInputText = screen.getByRole('textbox');
    expect(chatInputText).toBeDisabled();
    await userEvent.type(chatInputText, 'A simple message');
    expect(chatInputText).toHaveValue('');
    const chatInputButton = screen.getByRole('button');
    expect(chatInputButton).toBeDisabled();

    await userEvent.keyboard('{enter}');

    expect(mockHandleUserInputFailure).not.toHaveBeenCalledWith();
  });
});

describe('<InputBar /> UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays the component in 'chatInput' format (without value typed) and compares it with previous renders. [screenshot]", async () => {
    await renderImageSnapshot(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={true}
        placeholderText={exampleTextPlaceholder}
      />,
    );

    expect(screen.getByText(exampleTextPlaceholder)).toBeInTheDocument();
  });

  it("displays the component in 'chatInput' format (with value typed) and compares it with previous renders. [screenshot]", async () => {
    render(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={true}
        placeholderText={exampleTextPlaceholder}
      />,
      {
        grommetOptions: {
          theme,
          style: { height: '100%' },
        },
      },
    );

    const chatInputText = screen.getByRole('textbox');
    expect(chatInputText).toBeInTheDocument();

    await userEvent.type(chatInputText, 'A text input example');
    await imageSnapshot();
  });

  it("displays the component in 'not-chatInput' format (without value typed) and compares it with previous renders. [screenshot]", async () => {
    await renderImageSnapshot(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={false}
        placeholderText={exampleTextPlaceholder}
      />,
    );

    expect(screen.getByText(exampleTextPlaceholder)).toBeInTheDocument();
  });

  it("displays the component in 'not-chatInput' format (with value typed) and compares it with previous renders. [screenshot]", async () => {
    render(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={false}
        placeholderText={exampleTextPlaceholder}
      />,
      {
        grommetOptions: {
          theme,
          style: { height: '100%' },
        },
      },
    );

    const chatInputText = screen.getByRole('textbox');
    expect(chatInputText).toBeInTheDocument();
    await userEvent.type(chatInputText, 'A text input example');
    await imageSnapshot();
  });

  it("displays the component in 'not-chatInput' format, with little width (for text placeholder ellipsis) and compares it with previous renders. [screenshot]", async () => {
    await renderImageSnapshot(
      <InputBar
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={false}
        placeholderText={exampleTextPlaceholder}
      />,
      150,
    );

    expect(screen.getByText(exampleTextPlaceholder)).toBeInTheDocument();
  });

  it('displays default value passed in props in the TextInput', () => {
    render(
      <InputBar
        defaultValue="Foo"
        handleUserInput={mockHandleUserInputSuccess}
        isChatInput={false}
        placeholderText={exampleTextPlaceholder}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveValue('Foo');
  });
});
