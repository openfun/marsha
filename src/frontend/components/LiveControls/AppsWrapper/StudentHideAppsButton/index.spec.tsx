import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { useLivePanelState } from 'data/stores/useLivePanelState';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { wrapInIntlProvider } from 'utils/tests/intl';

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

    render(wrapInIntlProvider(<StudentHideAppsButton />));

    fireEvent.click(screen.getByRole('button', { name: 'Hide apps' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(false);
  });
});
