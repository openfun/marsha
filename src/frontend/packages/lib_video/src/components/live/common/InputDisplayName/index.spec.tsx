/* eslint-disable testing-library/no-node-access */
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Nullable } from 'lib-common';
import { decodeJwt, useCurrentUser, liveSessionFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { setLiveSessionDisplayName } from 'api/setLiveSessionDisplayName';
import {
  ANONYMOUS_ID_PREFIX,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from 'conf/chat';
import { useLiveSession } from 'hooks/useLiveSession';
import { converse } from 'utils/window';

import { InputDisplayName } from '.';

jest.mock('utils/window', () => ({
  converse: {
    claimNewNicknameInChatRoom: jest.fn(),
  },
}));

jest.mock('api/setLiveSessionDisplayName', () => ({
  setLiveSessionDisplayName: jest.fn(),
}));

const mockConverse = converse.claimNewNicknameInChatRoom as jest.MockedFunction<
  typeof converse.claimNewNicknameInChatRoom
>;

const mockSetLiveSessionDisplayName =
  setLiveSessionDisplayName as jest.MockedFunction<
    typeof setLiveSessionDisplayName
  >;

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  decodeJwt: jest.fn(),
}));
const mockedDecodeJwt = decodeJwt as jest.MockedFunction<typeof decodeJwt>;

describe('<InputDisplayName />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it(`controls input and shows error when input contains "${ANONYMOUS_ID_PREFIX}"`, async () => {
    mockedDecodeJwt.mockReturnValue({} as any);

    render(<InputDisplayName />);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');

    userEvent.type(inputTextbox, `${ANONYMOUS_ID_PREFIX}-John`);
    userEvent.click(validateButton);

    await screen.findByText(`Keyword "${ANONYMOUS_ID_PREFIX}" is not allowed.`);
    expect(
      screen.queryByText(`Min length is ${NICKNAME_MIN_LENGTH} characters.`),
    ).toBeNull();
    expect(
      screen.queryByText(`Max length is ${NICKNAME_MAX_LENGTH} characters.`),
    ).toBeNull();
    expect(inputTextbox).toHaveValue(`${ANONYMOUS_ID_PREFIX}-John`);
  });

  it(`controls input and shows error when input contains less than ${NICKNAME_MIN_LENGTH} characters.`, async () => {
    mockedDecodeJwt.mockReturnValue({} as any);

    render(<InputDisplayName />);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');

    userEvent.type(inputTextbox, 'JD');
    userEvent.click(validateButton);

    await screen.findByText(`Min length is ${NICKNAME_MIN_LENGTH} characters.`);
    expect(
      screen.queryByText(`Keyword "${ANONYMOUS_ID_PREFIX}" is not allowed.`),
    ).toBeNull();
    expect(
      screen.queryByText(`Max length is ${NICKNAME_MAX_LENGTH} characters.`),
    ).toBeNull();
    expect(inputTextbox).toHaveValue('JD');
  });

  it(`controls input and shows error when input contains more than ${NICKNAME_MAX_LENGTH} characters.`, async () => {
    mockedDecodeJwt.mockReturnValue({} as any);

    render(<InputDisplayName />);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');

    userEvent.type(inputTextbox, 'John Doe the legend');
    userEvent.click(validateButton);

    await screen.findByText(`Max length is ${NICKNAME_MAX_LENGTH} characters.`);
    expect(
      screen.queryByText(`Keyword "${ANONYMOUS_ID_PREFIX}" is not allowed.`),
    ).toBeNull();
    expect(
      screen.queryByText(`Min length is ${NICKNAME_MIN_LENGTH} characters.`),
    ).toBeNull();
    expect(inputTextbox).toHaveValue('John Doe the legend');
  });

  it('enters a valid nickname but the server takes too long to answer.', async () => {
    mockedDecodeJwt.mockReturnValue({} as any);

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
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSessionFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(<InputDisplayName />);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    expect(validateButton.querySelector('svg')).toBeTruthy();
    userEvent.click(validateButton);
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(validateButton.querySelector('svg')).toBeNull();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() =>
      expect(validateButton.querySelector('svg')).toBeTruthy(),
    );
    screen.getByText('The server took too long to respond. Please retry.');
  });

  it('enters a valid nickname but it is already used by a live registration', async () => {
    mockedDecodeJwt.mockReturnValue({} as any);

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
    mockSetLiveSessionDisplayName.mockResolvedValue({
      error: 409,
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(<InputDisplayName />);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    expect(validateButton.querySelector('svg')).toBeTruthy();
    userEvent.click(validateButton);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(validateButton.querySelector('svg')).toBeNull();
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(0);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(validateButton.querySelector('svg')).toBeTruthy();
    screen.getByText(
      'Your nickname is already used in the chat. Please choose another one.',
    );
    expect(useLiveSession.getState().liveSession).toBeUndefined();
  });

  it('enters a valid nickname but it is already used in the chat', async () => {
    mockedDecodeJwt.mockReturnValue({} as any);

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
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSessionFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(<InputDisplayName />);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    expect(validateButton.querySelector('svg')).toBeTruthy();
    userEvent.click(validateButton);
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(validateButton.querySelector('svg')).toBeNull();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() =>
      expect(validateButton.querySelector('svg')).toBeTruthy(),
    );
    screen.getByText(
      'Your nickname is already used in the chat. Please choose another one.',
    );
    expect(useLiveSession.getState().liveSession).toBeUndefined();
  });

  it('enters a valid nickname but the server returns an unknown response', async () => {
    mockedDecodeJwt.mockReturnValue({} as any);

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
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSessionFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(<InputDisplayName />);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    expect(validateButton.querySelector('svg')).toBeTruthy();
    userEvent.click(validateButton);
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(validateButton.querySelector('svg')).toBeNull();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() =>
      expect(validateButton.querySelector('svg')).toBeTruthy(),
    );
    screen.getByText('Impossible to connect you to the chat. Please retry.');
    expect(useLiveSession.getState().liveSession).toBeUndefined();
  });

  it('enters a valid nickname and validates it.', async () => {
    mockedDecodeJwt.mockReturnValue({} as any);

    mockConverse.mockImplementation(
      (
        _displayName: string,
        callbackSuccess: () => void,
        _callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        callbackSuccess();
      },
    );
    const liveSession = liveSessionFactory({
      display_name: 'John_Doe',
    });
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSession,
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(<InputDisplayName />);

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    userEvent.type(inputTextbox, 'John_Doe');
    userEvent.click(validateButton);
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );

    expect(converse.claimNewNicknameInChatRoom).toHaveBeenNthCalledWith(
      1,
      'John_Doe',
      expect.any(Function),
      expect.any(Function),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    expect(useLiveSession.getState().liveSession).toEqual(liveSession);
  });

  it('displays the component and use liveSession username as default value', () => {
    mockedDecodeJwt.mockReturnValue({
      user: {
        id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
        username: 'jane_doe',
      },
    } as any);
    useCurrentUser.setState({
      currentUser: {
        username: 'jane_doe',
      } as any,
    });

    const liveSession = liveSessionFactory({ username: 'Foo' });
    useLiveSession.getState().setLiveSession(liveSession);

    render(<InputDisplayName />);

    expect(screen.getByRole('textbox')).toHaveValue('Foo');
  });

  it('displays the component and use jwt display_name as default value', () => {
    mockedDecodeJwt.mockReturnValue({
      user: {
        id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
        username: 'jane_doe',
      },
    } as any);
    useCurrentUser.setState({
      currentUser: {
        username: 'jane_doe',
      } as any,
    });

    render(<InputDisplayName />);

    expect(screen.getByRole('textbox')).toHaveValue('jane_doe');
  });
});
