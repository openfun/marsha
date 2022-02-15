import { act, render, screen } from '@testing-library/react';
import { Grommet } from 'grommet';
import { DateTime } from 'luxon';
import React from 'react';

import { presenceType, useChatItemState } from 'data/stores/useChatItemsStore';
import { imageSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { theme } from 'utils/theme/theme';
import { ChatConversationDisplayer } from '.';

const mockScrollTo = jest.fn();
window.HTMLElement.prototype.scrollTo = mockScrollTo;

jest.mock('utils/errors/report', () => ({
  report: jest.fn(),
}));

describe('<ChatConversationDisplayer />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('displays correctly message history and new presences.', () => {
    render(wrapInIntlProvider(<ChatConversationDisplayer />));

    for (let i = 0; i < 5; i++) {
      act(() =>
        useChatItemState.getState().addMessage({
          content: `This is example message n°${i}`,
          sender: `John Doe n°${i}`,
          sentAt: DateTime.fromISO(`2020-01-01T12:1${i}:12`),
        }),
      );
    }
    for (let i = 0; i < 2; i++) {
      act(() =>
        useChatItemState.getState().addPresence({
          receivedAt: DateTime.fromISO(`2020-01-01T12:2${i}:12`),
          sender: `John Doe n°${i}`,
          type: presenceType.ARRIVAL,
        }),
      );
    }

    for (let i = 0; i < 5; i++) {
      screen.getByText(`(12:1${i})`);
      screen.getByText(`John Doe n°${i}`);
      screen.getByText(`This is example message n°${i}`);
    }
    screen.queryByText('John Doe n°1 has joined');
    screen.queryByText('John Doe n°2 has joined');
  });

  it('scrolls down to bottom, when scroll bar is previously set to bottom.', async () => {
    render(wrapInIntlProvider(<ChatConversationDisplayer />));

    expect(mockScrollTo).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 5; i++) {
      act(() =>
        useChatItemState.getState().addMessage({
          content: `This is example message n°${i}`,
          sender: `John Doe n°${i}`,
          sentAt: DateTime.fromISO(`2020-01-01T12:1${i}:12`),
        }),
      );
    }
    expect(mockScrollTo).toHaveBeenCalledTimes(6);
  });

  it('renders components with messages and presences and compares it with previous render.', async () => {
    render(
      wrapInIntlProvider(
        <Grommet theme={theme}>
          <ChatConversationDisplayer />
        </Grommet>,
      ),
    );

    for (let i = 0; i < 5; i++) {
      act(() =>
        useChatItemState.getState().addMessage({
          content: `This is example message n°${i}`,
          sender: `John Doe n°${i}`,
          sentAt: DateTime.fromISO(`2020-01-01T12:1${i}:12`),
        }),
      );
    }

    act(() =>
      useChatItemState.getState().addPresence({
        receivedAt: DateTime.fromISO('2020-01-01T12:12:00'),
        sender: 'John_Doe',
        type: presenceType.ARRIVAL,
      }),
    );

    act(() =>
      useChatItemState.getState().addMessage({
        content: 'Hello everyone !',
        sender: 'John_Doe',
        sentAt: DateTime.fromISO('2020-01-01T12:12:10'),
      }),
    );

    act(() =>
      useChatItemState.getState().addMessage({
        content: 'Hello John !',
        sender: 'Jane_Doe',
        sentAt: DateTime.fromISO('2020-01-01T12:12:25'),
      }),
    );

    act(() =>
      useChatItemState.getState().addPresence({
        receivedAt: DateTime.fromISO('2020-01-01T12:12:27'),
        sender: 'John_Doe',
        type: presenceType.DEPARTURE,
      }),
    );

    await imageSnapshot(800, 1000);
  });
});
