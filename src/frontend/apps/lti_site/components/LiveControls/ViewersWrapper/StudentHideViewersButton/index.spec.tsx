import React from 'react';
import { screen, fireEvent } from '@testing-library/react';

import { useLivePanelState } from 'data/stores/useLivePanelState';
import render from 'utils/tests/render';

import { StudentHideViewersButton } from '.';

describe('<StudentHideViewersButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide viewers button [screenshot]', async () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentHideViewersButton />);

    screen.getByRole('button', { name: 'Hide viewers' });
  });

  it('closes the panel and select viewers item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(<StudentHideViewersButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide viewers' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(false);
  });
});
