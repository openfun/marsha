import { screen, fireEvent } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { StudentShowAppsButton } from '.';

describe('<StudentShowAppsButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the student show apps button [screenshot]', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentShowAppsButton />);

    expect(
      screen.getByRole('button', { name: 'Show apps' }),
    ).toBeInTheDocument();
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
