import React from 'react';
import { screen, fireEvent } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import render from 'utils/tests/render';

import { StudentShowAppsButton } from '.';

describe('<StudentShowAppsButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the student show apps button [screenshot]', async () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    await renderIconSnapshot(<StudentShowAppsButton />);

    screen.getByRole('button', { name: 'Show apps' });
  });

  it('opens the panel and select app item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(<StudentShowAppsButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Show apps' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(
      true,
      LivePanelItem.APPLICATION,
    );
  });
});
