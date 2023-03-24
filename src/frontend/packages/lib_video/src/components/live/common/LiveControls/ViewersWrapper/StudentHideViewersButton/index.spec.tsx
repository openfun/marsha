import { screen, fireEvent } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { useLivePanelState } from '@lib-video/hooks/useLivePanelState';

import { StudentHideViewersButton } from '.';

describe('<StudentHideViewersButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the hide viewers button [screenshot]', () => {
    useLivePanelState.setState({
      setPanelVisibility: jest.fn(),
    });

    render(<StudentHideViewersButton />);

    expect(
      screen.getByRole('button', { name: 'Hide viewers' }),
    ).toBeInTheDocument();
  });

  it('closes the panel and select viewers item', () => {
    const mockSetPanelVisibility = jest.fn();
    useLivePanelState.setState({
      setPanelVisibility: mockSetPanelVisibility,
    });

    render(<StudentHideViewersButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Hide viewers' }));

    expect(mockSetPanelVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetPanelVisibility).toHaveBeenCalledWith(false);
  });
});
