import { screen, fireEvent } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { useLivePanelState } from '@lib-video/hooks/useLivePanelState';

import { StudentHideChatButton } from '.';

describe('<StudentHideChatButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide chat button [screenshot]', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentHideChatButton />);

    expect(
      screen.getByRole('button', { name: 'Hide chat' }),
    ).toBeInTheDocument();
  });

  it('closes the panel on click', () => {
    const mockSetPAnelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPAnelVisibility,
    });

    render(<StudentHideChatButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide chat' }));

    expect(mockSetPAnelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPAnelVisibility).toHaveBeenCalledWith(false);
  });
});
