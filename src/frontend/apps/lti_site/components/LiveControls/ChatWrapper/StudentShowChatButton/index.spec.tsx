import React from 'react';
import { screen, fireEvent } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import render from 'utils/tests/render';

import { StudentShowChatButton } from '.';

describe('<StudentShowChatButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the show chat button [screenshot]', async () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentShowChatButton />);

    screen.getByRole('button', { name: 'Show chat' });
  });

  it('opens the panel on click and display the chat', () => {
    const mockSetPAnelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPAnelVisibility,
    });

    render(<StudentShowChatButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Show chat' }));

    expect(mockSetPAnelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPAnelVisibility).toHaveBeenCalledWith(
      true,
      LivePanelItem.CHAT,
    );
  });
});
