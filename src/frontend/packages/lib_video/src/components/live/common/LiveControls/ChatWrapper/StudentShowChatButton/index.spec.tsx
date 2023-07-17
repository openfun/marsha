import { fireEvent, screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { StudentShowChatButton } from '.';

describe('<StudentShowChatButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the show chat button [screenshot]', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentShowChatButton />);

    expect(
      screen.getByRole('button', { name: 'Show chat' }),
    ).toBeInTheDocument();
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
