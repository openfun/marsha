import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentShowChatButton } from '.';

jest.mock('components/SVGIcons/ChatSVG', () => ({
  ChatSVG: () => <span>chat icon</span>,
}));

describe('<StudentShowChatButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the show chat button', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(wrapInIntlProvider(<StudentShowChatButton />));

    screen.getByRole('button', { name: 'Show chat' });
    screen.getByText('chat icon');
  });

  it('opens the panel on click and display the chat', () => {
    const mockSetPAnelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPAnelVisibility,
    });

    render(wrapInIntlProvider(<StudentShowChatButton />));

    fireEvent.click(screen.getByRole('button', { name: 'Show chat' }));

    expect(mockSetPAnelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPAnelVisibility).toHaveBeenCalledWith(
      true,
      LivePanelItem.CHAT,
    );
  });
});
