import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { setLiveRegistrationDisplayName } from 'data/sideEffects/setLiveRegistrationDisplayName';
import { useLiveRegistration } from 'data/stores/useLiveRegistration';
import {
  ANONYMOUS_ID_PREFIX,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from 'default/chat';
import { liveRegistrationFactory } from 'utils/tests/factories';
import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { Nullable } from 'utils/types';
import { converse } from 'utils/window';
import { InputDisplayNameOverlay } from './index';

const mockSetOverlay = jest.fn();

jest.mock('utils/window', () => ({
  converse: {
    claimNewNicknameInChatRoom: jest.fn(),
  },
}));

jest.mock('data/sideEffects/setLiveRegistrationDisplayName', () => ({
  setLiveRegistrationDisplayName: jest.fn(),
}));
jest.mock('utils/checkLtiToken', () => ({
  checkLtiToken: jest.fn(),
}));
jest.mock('data/appData', () => ({
  getDecodedJwt: jest.fn(),
}));

const mockConverse = converse.claimNewNicknameInChatRoom as jest.MockedFunction<
  typeof converse.claimNewNicknameInChatRoom
>;

const mockSetLiveRegistrationDisplayName =
  setLiveRegistrationDisplayName as jest.MockedFunction<
    typeof setLiveRegistrationDisplayName
  >;

describe('<InputDisplayNameOverlay />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
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
    expect(mockSetOverlay).not.toHaveBeenCalled();
  });

  it('enters a valid nickname but the server takes too long to answer.', async () => {
    mockConverse.mockImplementation(
      async (
        _displayName: string,
        _callbackSuccess: () => void,
        callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        await new Promise((r) => setTimeout(r, 2000));
        callbackError(null);
      },
    );
    mockSetLiveRegistrationDisplayName.mockResolvedValue({
      success: liveRegistrationFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();

    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    expect(validateButton.querySelector('svg')).toBeTruthy();
    act(() => userEvent.click(validateButton));
    await waitFor(() =>
      expect(mockSetLiveRegistrationDisplayName).toHaveBeenCalled(),
    );
    expect(mockSetOverlay).toHaveBeenCalledTimes(0);
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(validateButton.querySelector('svg')).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(validateButton.querySelector('svg')).toBeTruthy();
    screen.getByText('The server took too long to respond. Please retry.');
  });

  it('enters a valid nickname but it is already used by a live registration', async () => {
    mockConverse.mockImplementation(
      async (
        _displayName: string,
        _callbackSuccess: () => void,
        callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        await new Promise((r) => setTimeout(r, 2000));
        const parser = new DOMParser();
        callbackError(
          parser.parseFromString(
            '<error code="409" />',
            'text/xml',
          ) as any as HTMLElement,
        );
      },
    );
    mockSetLiveRegistrationDisplayName.mockResolvedValue({
      error: 409,
    });
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();
    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    expect(validateButton.querySelector('svg')).toBeTruthy();
    act(() => userEvent.click(validateButton));
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(validateButton.querySelector('svg')).toBeNull();
    await waitFor(() =>
      expect(mockSetLiveRegistrationDisplayName).toHaveBeenCalled(),
    );
    expect(mockSetOverlay).toHaveBeenCalledTimes(0);
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(0);
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(validateButton.querySelector('svg')).toBeTruthy();
    screen.getByText(
      'Your nickname is already used in the chat. Please choose another one.',
    );
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();
  });

  it('enters a valid nickname but it is already used in the chat', async () => {
    mockConverse.mockImplementation(
      async (
        _displayName: string,
        _callbackSuccess: () => void,
        callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        await new Promise((r) => setTimeout(r, 2000));
        const parser = new DOMParser();
        callbackError(
          parser.parseFromString(
            '<error code="409" />',
            'text/xml',
          ) as any as HTMLElement,
        );
      },
    );
    mockSetLiveRegistrationDisplayName.mockResolvedValue({
      success: liveRegistrationFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();
    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    expect(validateButton.querySelector('svg')).toBeTruthy();
    act(() => userEvent.click(validateButton));
    await waitFor(() =>
      expect(mockSetLiveRegistrationDisplayName).toHaveBeenCalled(),
    );
    expect(mockSetOverlay).toHaveBeenCalledTimes(0);
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(validateButton.querySelector('svg')).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(validateButton.querySelector('svg')).toBeTruthy();
    screen.getByText(
      'Your nickname is already used in the chat. Please choose another one.',
    );
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();
  });

  it('enters a valid nickname but the server returns an unknown response', async () => {
    mockConverse.mockImplementation(
      async (
        _displayName: string,
        _callbackSuccess: () => void,
        callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        await new Promise((r) => setTimeout(r, 2000));
        const parser = new DOMParser();
        callbackError(
          parser.parseFromString(
            '<unknownStanza unknownAttribute="unrecognizedValue" />',
            'text/xml',
          ) as any as HTMLElement,
        );
      },
    );
    mockSetLiveRegistrationDisplayName.mockResolvedValue({
      success: liveRegistrationFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();

    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    expect(validateButton.querySelector('svg')).toBeTruthy();
    act(() => userEvent.click(validateButton));
    await waitFor(() =>
      expect(mockSetLiveRegistrationDisplayName).toHaveBeenCalled(),
    );
    expect(mockSetOverlay).toHaveBeenCalledTimes(0);
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(validateButton.querySelector('svg')).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(validateButton.querySelector('svg')).toBeTruthy();
    screen.getByText('Impossible to connect you to the chat. Please retry.');
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();
  });

  it('enters a valid nickname and validates it.', async () => {
    mockConverse.mockImplementation(
      async (
        _displayName: string,
        callbackSuccess: () => void,
        _callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        callbackSuccess();
      },
    );
    const liveRegistration = liveRegistrationFactory({
      display_name: 'John_Doe',
    });
    mockSetLiveRegistrationDisplayName.mockResolvedValue({
      success: liveRegistration,
    });
    expect(useLiveRegistration.getState().liveRegistration).toBeUndefined();

    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    act(() => userEvent.click(validateButton));
    await waitFor(() =>
      expect(mockSetLiveRegistrationDisplayName).toHaveBeenCalled(),
    );
    expect(mockSetOverlay).toHaveBeenCalledTimes(1);
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenNthCalledWith(
      1,
      'John_Doe',
      expect.any(Function),
      expect.any(Function),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    expect(useLiveRegistration.getState().liveRegistration).toEqual(
      liveRegistration,
    );
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
    expect(mockSetOverlay).toHaveBeenCalledTimes(1);
    expect(mockSetLiveRegistrationDisplayName).not.toHaveBeenCalled();
  });

  it('displays the component and use liveragistration username as default value', () => {
    const liveRegistration = liveRegistrationFactory({ username: 'Foo' });
    useLiveRegistration.getState().setLiveRegistration(liveRegistration);
    render(
      wrapInIntlProvider(
        <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
      ),
    );
    expect(screen.getByRole('textbox')).toHaveValue('Foo');
  });

  it('displays the component and compares it with previous render.', async () => {
    await renderImageSnapshot(
      <InputDisplayNameOverlay setOverlay={mockSetOverlay} />,
    );
  });
});
