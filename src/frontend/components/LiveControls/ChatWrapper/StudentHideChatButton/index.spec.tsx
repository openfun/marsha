import React from 'react';
import { screen, fireEvent } from '@testing-library/react';

import { useLivePanelState } from 'data/stores/useLivePanelState';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import render from 'utils/tests/render';

import { StudentHideChatButton } from '.';

describe('<StudentHideChatButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide chat button [screenshot]', async () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    await renderIconSnapshot(<StudentHideChatButton />);

    screen.getByRole('button', { name: 'Hide chat' });
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
