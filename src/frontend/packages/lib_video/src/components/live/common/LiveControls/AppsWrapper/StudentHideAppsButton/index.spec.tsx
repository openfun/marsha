import { screen, fireEvent } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { useLivePanelState } from '@lib-video/hooks/useLivePanelState';

import { StudentHideAppsButton } from '.';

describe('<StudentHideAppsButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide apps button [screenshot]', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentHideAppsButton />);

    expect(
      screen.getByRole('button', { name: 'Hide apps' }),
    ).toBeInTheDocument();
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
