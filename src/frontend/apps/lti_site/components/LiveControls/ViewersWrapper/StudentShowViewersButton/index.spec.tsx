import React from 'react';
import { screen, fireEvent } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import render from 'utils/tests/render';

import { StudentShowViewersButton } from '.';

describe('<StudentShowViewersButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the student show viewers button [screenshot]', async () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentShowViewersButton />);

    screen.getByRole('button', { name: 'Show viewers' });
  });

  it('opens the panel and select viewers item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(<StudentShowViewersButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Show viewers' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(
      true,
      LivePanelItem.VIEWERS_LIST,
    );
  });
});
