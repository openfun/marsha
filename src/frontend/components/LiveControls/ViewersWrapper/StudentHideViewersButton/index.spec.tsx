import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { useLivePanelState } from 'data/stores/useLivePanelState';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { StudentHideViewersButton } from '.';

describe('<StudentHideViewersButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide viewers button [screenshot]', async () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    await renderIconSnapshot(<StudentHideViewersButton />);

    screen.getByRole('button', { name: 'Hide viewers' });
  });

  it('closes the panel and select viewers item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(wrapInIntlProvider(<StudentHideViewersButton />));

    fireEvent.click(screen.getByRole('button', { name: 'Hide viewers' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(false);
  });
});
