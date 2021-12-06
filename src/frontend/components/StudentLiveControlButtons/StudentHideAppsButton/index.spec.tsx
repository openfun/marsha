import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { useLivePanelState } from 'data/stores/useLivePanelState';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentHideAppsButton } from '.';

jest.mock('components/SVGIcons/AppsSVG', () => ({
  AppsSVG: () => <span>app icon</span>,
}));

describe('<StudentHideAppsButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide apps button', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(wrapInIntlProvider(<StudentHideAppsButton />));

    screen.getByRole('button', { name: 'Hide apps' });
    screen.getByText('app icon');
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
