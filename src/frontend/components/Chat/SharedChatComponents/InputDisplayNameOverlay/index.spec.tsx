import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useChatItemState } from 'data/stores/useChatItemsStore';
import {
  ANONYMOUS_ID_PREFIX,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from 'default/chat';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { converse } from 'utils/window';
import { InputDisplayNameOverlay } from './index';

const mockSetOverlay = jest.fn();

jest.mock('utils/window', () => ({
  converse: {
    claimNewNicknameInChatRoom: jest.fn(),
  },
}));

describe('<InputDisplayNameOverlay />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it(`controls input and shows error when input contains "${ANONYMOUS_ID_PREFIX}"`, () => {
    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, `${ANONYMOUS_ID_PREFIX}-John`);
    act(() => userEvent.click(validateButton));
    screen.getByText(`Keyword "${ANONYMOUS_ID_PREFIX}" is not allowed.`);
    expect(
      screen.queryByText(`Min length is ${NICKNAME_MIN_LENGTH} characters.`),
    ).toBeNull();
    expect(
      screen.queryByText(`Max length is ${NICKNAME_MAX_LENGTH} characters.`),
    ).toBeNull();
    expect(inputTextbox).toHaveValue(`${ANONYMOUS_ID_PREFIX}-John`);
    expect(useChatItemState.getState().displayName).toBeNull();
    expect(mockSetOverlay).not.toHaveBeenCalled();
  });

  it(`controls input and shows error when input contains less than ${NICKNAME_MIN_LENGTH} characters.`, () => {
    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'JD');
    act(() => userEvent.click(validateButton));
    screen.getByText(`Min length is ${NICKNAME_MIN_LENGTH} characters.`);
    expect(
      screen.queryByText(`Keyword "${ANONYMOUS_ID_PREFIX}" is not allowed.`),
    ).toBeNull();
    expect(
      screen.queryByText(`Max length is ${NICKNAME_MAX_LENGTH} characters.`),
    ).toBeNull();
    expect(inputTextbox).toHaveValue('JD');
    expect(useChatItemState.getState().displayName).toBeNull();
    expect(mockSetOverlay).not.toHaveBeenCalled();
  });

  it(`controls input and shows error when input contains more than ${NICKNAME_MAX_LENGTH} characters.`, () => {
    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John Doe the legend');
    act(() => userEvent.click(validateButton));
    screen.getByText(`Max length is ${NICKNAME_MAX_LENGTH} characters.`);
    expect(
      screen.queryByText(`Keyword "${ANONYMOUS_ID_PREFIX}" is not allowed.`),
    ).toBeNull();
    expect(
      screen.queryByText(`Min length is ${NICKNAME_MIN_LENGTH} characters.`),
    ).toBeNull();
    expect(inputTextbox).toHaveValue('John Doe the legend');
    expect(useChatItemState.getState().displayName).toBeNull();
    expect(mockSetOverlay).not.toHaveBeenCalled();
  });

  it('enters a valid nickname and validates it.', () => {
    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    act(() => userEvent.click(validateButton));
    expect(mockSetOverlay).toHaveBeenCalledTimes(1);
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenNthCalledWith(
      1,
      'John_Doe',
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    expect(useChatItemState.getState().displayName).toEqual('John_Doe');
  });

  it('closes the window.', () => {
    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const closeButton = screen.getByTitle(
      'Click this button to close the overlay.',
    );
    act(() => userEvent.click(closeButton));
    expect(useChatItemState.getState().displayName).toBeNull();
    expect(mockSetOverlay).toHaveBeenCalledTimes(1);
    expect(useChatItemState.getState().displayName).toBeNull();
  });

  it('displays the component and compares it with previous render.', async () => {
    await renderImageSnapshot(
      <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
    );
  });
});
