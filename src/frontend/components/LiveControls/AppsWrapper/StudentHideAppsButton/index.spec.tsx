import React from 'react';
import { screen, fireEvent } from '@testing-library/react';

import { useLivePanelState } from 'data/stores/useLivePanelState';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import render from 'utils/tests/render';

import { StudentHideAppsButton } from '.';

describe('<StudentHideAppsButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide apps button [screenshot]', async () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    await renderIconSnapshot(<StudentHideAppsButton />);

    screen.getByRole('button', { name: 'Hide apps' });
  });

  it('closes the panel and select app item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(<StudentHideAppsButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide apps' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(false);
  });
});
