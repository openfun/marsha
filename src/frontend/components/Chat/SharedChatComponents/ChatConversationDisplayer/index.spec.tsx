import { DateTime } from 'luxon';
import React from 'react';

import { useMessagesState } from 'data/stores/useMessagesStore';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { ChatConversationDisplayer } from '.';
import { act, render, screen } from '@testing-library/react';

const mockScrollTo = jest.fn();
window.HTMLElement.prototype.scrollTo = mockScrollTo;

describe('<ChatConversationDisplayer />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('checks spinner is displayed first, and then chat messages', async () => {
    render(wrapInIntlProvider(<ChatConversationDisplayer />));

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    for (let i = 0; i < 5; i++) {
      act(() =>
        useMessagesState.getState().addMessage({
          sentAt: DateTime.fromISO(`2020-01-01T1${i}:1${i}:12`),
          sender: `John Doe n°${i}`,
          content: `This is example message n°${i}`,
        }),
      );
    }

    for (let i = 0; i < 5; i++) {
      screen.getByText(`(1${i}:1${i})`);
      screen.getByText(`John Doe n°${i}`);
      screen.getByText(`This is example message n°${i}`);
    }
  });

  it('checks that scroll bar sticks to bottom when new message comes ', async () => {
    render(wrapInIntlProvider(<ChatConversationDisplayer />));

    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    expect(mockScrollTo).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 5; i++) {
      act(() =>
        useMessagesState.getState().addMessage({
          sentAt: DateTime.fromISO(`2020-01-01T12:12:1${i}`),
          sender: `John Doe n°${i}`,
          content: `This is example message n°${i}`,
        }),
      );
    }
    expect(mockScrollTo).toHaveBeenCalledTimes(6);
  });
});
