import { act, screen, waitFor } from '@testing-library/react';
import userEventInit from '@testing-library/user-event';
import { Nullable } from 'lib-common';
import {
  liveMockFactory,
  liveSessionFactory,
  useCurrentUser,
  useJwt,
} from 'lib-components';
import { render, wrapInIntlProvider } from 'lib-tests';

import { setLiveSessionDisplayName } from '@lib-video/api/setLiveSessionDisplayName';
import {
  ANONYMOUS_ID_PREFIX,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
} from '@lib-video/conf/chat';
import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { converse } from '@lib-video/utils/window';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { InputDisplayNameOverlay } from '.';

const mockSetDisplayName = jest.fn();
jest.mock('hooks/useSetDisplayName', () => ({
  useSetDisplayName: () => [false, mockSetDisplayName],
}));

jest.mock('utils/window', () => ({
  converse: {
    claimNewNicknameInChatRoom: jest.fn(),
  },
}));

jest.mock('api/setLiveSessionDisplayName', () => ({
  setLiveSessionDisplayName: jest.fn(),
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  checkLtiToken: jest.fn(),
  decodeJwt: jest.fn(),
}));

const mockConverse = converse.claimNewNicknameInChatRoom as jest.MockedFunction<
  typeof converse.claimNewNicknameInChatRoom
>;

const mockSetLiveSessionDisplayName =
  setLiveSessionDisplayName as jest.MockedFunction<
    typeof setLiveSessionDisplayName
  >;

const live = liveMockFactory({
  id: 'some-live-id',
});

const userEvent = userEventInit.setup({
  advanceTimers: jest.advanceTimersByTime,
});

describe('<InputDisplayNameOverlay />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it(`controls input and shows error when input contains "${ANONYMOUS_ID_PREFIX}"`, async () => {
    useJwt.setState({
      getDecodedJwt: () => ({}) as any,
    });

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');

    await userEvent.type(inputTextbox, `${ANONYMOUS_ID_PREFIX}-John`);
    await userEvent.click(validateButton);

    await screen.findByText(`Keyword "${ANONYMOUS_ID_PREFIX}" is not allowed.`);
    expect(
      screen.queryByText(`Min length is ${NICKNAME_MIN_LENGTH} characters.`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(`Max length is ${NICKNAME_MAX_LENGTH} characters.`),
    ).not.toBeInTheDocument();
    expect(inputTextbox).toHaveValue(`${ANONYMOUS_ID_PREFIX}-John`);
  });

  it(`controls input and shows error when input contains less than ${NICKNAME_MIN_LENGTH} characters.`, async () => {
    useJwt.setState({
      getDecodedJwt: () => ({}) as any,
    });

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');

    await userEvent.type(inputTextbox, 'JD');
    await userEvent.click(validateButton);

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
    useJwt.setState({
      getDecodedJwt: () => ({}) as any,
    });

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');

    await userEvent.type(inputTextbox, 'John Doe the legend');
    await userEvent.click(validateButton);

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
    mockConverse.mockImplementation(
      (
        _displayName: string,
        _callbackSuccess: () => void,
        callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        new Promise((r) => setTimeout(r, 2000)).then(() => {
          callbackError(null);
        });
      },
    );
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSessionFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button', { name: 'send' });
    await userEvent.type(inputTextbox, 'John_Doe');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await userEvent.click(validateButton);
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(
      screen.queryByRole('button', { name: 'send' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(
      await screen.findByRole('button', { name: 'send' }),
    ).toBeInTheDocument();
    screen.getByText('The server took too long to respond. Please retry.');
  });

  it('enters a valid nickname but it is already used by a live registration', async () => {
    useJwt.setState({
      getDecodedJwt: () => ({}) as any,
    });

    mockConverse.mockImplementation(
      (
        _displayName: string,
        _callbackSuccess: () => void,
        callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        new Promise((r) => setTimeout(r, 2000)).then(() => {
          const parser = new DOMParser();
          callbackError(
            parser.parseFromString(
              '<error code="409" />',
              'text/xml',
            ) as any as HTMLElement,
          );
        });
      },
    );
    mockSetLiveSessionDisplayName.mockResolvedValue({
      error: 409,
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button', { name: 'send' });
    await userEvent.type(inputTextbox, 'John_Doe');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await userEvent.click(validateButton);
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(0);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(
      await screen.findByRole('button', { name: 'send' }),
    ).toBeInTheDocument();
    screen.getByText(
      'Your nickname is already used in the chat. Please choose another one.',
    );
    expect(useLiveSession.getState().liveSession).toBeUndefined();
  });

  it('enters a valid nickname but it is already used in the chat', async () => {
    useJwt.setState({
      getDecodedJwt: () => ({}) as any,
    });

    mockConverse.mockImplementation(
      (
        _displayName: string,
        _callbackSuccess: () => void,
        callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        new Promise((r) => setTimeout(r, 2000)).then(() => {
          const parser = new DOMParser();
          callbackError(
            parser.parseFromString(
              '<error code="409" />',
              'text/xml',
            ) as any as HTMLElement,
          );
        });
      },
    );
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSessionFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button', { name: 'send' });
    await userEvent.type(inputTextbox, 'John_Doe');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await userEvent.click(validateButton);
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(
      screen.queryByRole('button', { name: 'send' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(
      await screen.findByRole('button', { name: 'send' }),
    ).toBeInTheDocument();
    screen.getByText(
      'Your nickname is already used in the chat. Please choose another one.',
    );
    expect(useLiveSession.getState().liveSession).toBeUndefined();
  });

  it('enters a valid nickname but the server returns an unknown response', async () => {
    useJwt.setState({
      getDecodedJwt: () => ({}) as any,
    });

    mockConverse.mockImplementation(
      (
        _displayName: string,
        _callbackSuccess: () => void,
        callbackError: (stanza: Nullable<HTMLElement>) => void,
      ) => {
        new Promise((r) => setTimeout(r, 2000)).then(() => {
          const parser = new DOMParser();
          callbackError(
            parser.parseFromString(
              '<unknownStanza unknownAttribute="unrecognizedValue" />',
              'text/xml',
            ) as any as HTMLElement,
          );
        });
      },
    );
    mockSetLiveSessionDisplayName.mockResolvedValue({
      success: liveSessionFactory({ display_name: 'John_Doe' }),
    });
    expect(useLiveSession.getState().liveSession).toBeUndefined();

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button', { name: 'send' });
    await userEvent.type(inputTextbox, 'John_Doe');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await userEvent.click(validateButton);
    await waitFor(() =>
      expect(mockSetLiveSessionDisplayName).toHaveBeenCalled(),
    );
    expect(converse.claimNewNicknameInChatRoom).toHaveBeenCalledTimes(1);
    // When waiting prosody answer, svg button is replaced by a waiting spinner
    expect(
      screen.queryByRole('button', { name: 'send' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(
      await screen.findByRole('button', { name: 'send' }),
    ).toBeInTheDocument();
    screen.getByText('Impossible to connect you to the chat. Please retry.');
    expect(useLiveSession.getState().liveSession).toBeUndefined();
  });

  it('enters a valid nickname and validates it.', async () => {
    useJwt.setState({
      jwt: 'some_jwt',
    });

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

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const inputTextbox = screen.getByRole('textbox');
    const validateButton = screen.getByRole('button');
    await userEvent.type(inputTextbox, 'John_Doe');
    await userEvent.click(validateButton);
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

    expect(mockSetDisplayName).toHaveBeenCalled();
    expect(mockSetDisplayName).toHaveBeenCalledWith(false);
  });

  it('closes the window.', async () => {
    useJwt.setState({
      jwt: 'some_jwt',
    });
    useCurrentUser.setState({
      currentUser: {
        id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
        username: 'jane_doe',
      } as any,
    });

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    const closeButton = screen.getByTitle(
      'Click this button to close the overlay.',
    );
    await userEvent.click(closeButton);
    expect(mockSetLiveSessionDisplayName).not.toHaveBeenCalled();

    expect(mockSetDisplayName).toHaveBeenCalled();
    expect(mockSetDisplayName).toHaveBeenCalledWith(false);
  });

  it('displays the component and use liveragistration username as default value', () => {
    useJwt.setState({
      jwt: 'some_jwt',
    });
    useCurrentUser.setState({
      currentUser: {
        id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
        username: 'jane_doe',
      } as any,
    });

    const liveSession = liveSessionFactory({ username: 'Foo' });
    useLiveSession.getState().setLiveSession(liveSession);

    render(wrapInVideo(<InputDisplayNameOverlay />, live));

    expect(screen.getByRole('textbox')).toHaveValue('Foo');
  });

  it('displays the component and use jwt display_name as default value', () => {
    useJwt.setState({
      jwt: 'some_jwt',
    });
    useCurrentUser.setState({
      currentUser: {
        id: '7f93178b-e578-44a6-8c85-ef267b6bf431',
        username: 'jane_doe',
      } as any,
    });

    render(wrapInVideo(wrapInIntlProvider(<InputDisplayNameOverlay />), live));

    expect(screen.getByRole('textbox')).toHaveValue('jane_doe');
  });
});
