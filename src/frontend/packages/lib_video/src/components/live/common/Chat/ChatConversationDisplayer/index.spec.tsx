import { act, screen } from '@testing-library/react';
import { theme } from 'lib-common';
import { imageSnapshot, render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import { useChatItemState } from '@lib-video/hooks/useChatItemsStore';

import { ChatConversationDisplayer } from '.';

// eslint-disable-next-line jest/unbound-method
const mockScrollTo = window.HTMLElement.prototype
  .scrollTo as jest.MockedFunction<
  typeof window.HTMLElement.prototype.scrollTo
>;

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

describe('<ChatConversationDisplayer />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('displays correctly message history and new presences.', () => {
    render(<ChatConversationDisplayer />);

    for (let i = 0; i < 5; i++) {
      act(() =>
        useChatItemState.getState().addMessage({
          content: `This is example message n°${i}`,
          sender: `John Doe n°${i}`,
          sentAt: DateTime.fromISO(`2020-01-01T12:1${i}:12`),
        }),
      );
    }

    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`(12:1${i})`)).toBeInTheDocument();
      expect(screen.getByText(`John Doe n°${i}`)).toBeInTheDocument();
      expect(
        screen.getByText(`This is example message n°${i}`),
      ).toBeInTheDocument();
    }
  });

  it('displays correctly message history group.', () => {
    render(<ChatConversationDisplayer />);

    for (let i = 0; i < 5; i++) {
      act(() =>
        useChatItemState.getState().addMessage({
          content: `This is example message n°${i}`,
          sender: `John Doe`,
          sentAt: DateTime.fromISO(`2020-01-01T12:10:1${i}`),
        }),
      );
    }

    expect(screen.getByText(`John Doe`)).toBeInTheDocument();
    expect(screen.getByText(`(12:10)`)).toBeInTheDocument();
    expect(screen.getByText(`This is example message n°0`)).toBeInTheDocument();

    for (let i = 1; i < 5; i++) {
      expect(
        screen.getByText(`This is example message n°${i}`),
      ).toBeInTheDocument();
    }
  });

  it('scrolls down to bottom, when scroll bar is previously set to bottom.', () => {
    render(<ChatConversationDisplayer />);

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

  // eslint-disable-next-line jest/expect-expect
  it('renders components with messages and presences and compares it with previous render. [screenshot]', async () => {
    render(<ChatConversationDisplayer />, { grommetOptions: { theme } });

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

    await imageSnapshot(800, 1000);
  });
});
