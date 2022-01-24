import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { StudentShowViewersButton } from '.';

describe('<StudentShowViewersButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the student show viewers button', async () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    await renderIconSnapshot(<StudentShowViewersButton />);

    screen.getByRole('button', { name: 'Show viewers' });
  });

  it('opens the panel and select viewers item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(wrapInIntlProvider(<StudentShowViewersButton />));

    fireEvent.click(screen.getByRole('button', { name: 'Show viewers' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(
      true,
      LivePanelItem.JOIN_DISCUSSION,
    );
  });
});
