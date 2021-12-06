import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentShowAppsButton } from '.';

jest.mock('components/SVGIcons/AppsSVG', () => ({
  AppsSVG: () => <span>app icon</span>,
}));

describe('<StudentShowAppsButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the student show apps button', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(wrapInIntlProvider(<StudentShowAppsButton />));

    screen.getByRole('button', { name: 'Show apps' });
    screen.getByText('app icon');
  });

  it('opens the panel and select app item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(wrapInIntlProvider(<StudentShowAppsButton />));

    fireEvent.click(screen.getByRole('button', { name: 'Show apps' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(
      true,
      LivePanelItem.APPLICATION,
    );
  });
});
